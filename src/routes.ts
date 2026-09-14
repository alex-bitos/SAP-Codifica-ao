import crypto from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { z } from 'zod';
import { authenticate, changePassword, createSession, csrfProtection, hashPassword, login, logout, normalizeLogin, passwordError, requireAuth, requireRoles } from './auth.js';
import { audit } from './audit.js';
import { getPool, transaction } from './db.js';
import { fieldDefinitions } from './domain/field-config.js';
import { searchCategories } from './domain/category-search.js';
import { createBatch, createCode, previewCode } from './services/codes.js';
import { exportDatabase } from './services/exporter.js';
import { analyzeWorkbookAgainstDatabase, importWorkbook } from './services/importer.js';
import type { AuthUser, Role } from './types.js';

const router = Router();
const asyncRoute = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req, res)).catch(next);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 } });
const loginLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });

router.use(authenticate);
router.use(csrfProtection);

router.post('/auth/login', loginLimiter, asyncRoute(login));
router.post('/auth/logout', asyncRoute(logout));
router.get('/auth/me', asyncRoute(async (req, res) => {
  if (!req.user || !req.sessionId) return res.status(401).json({ error: 'Autenticação necessária.' });
  const csrfToken = crypto.randomBytes(32).toString('base64url');
  const csrfHash = crypto.createHash('sha256').update(csrfToken).digest('hex');
  await getPool().query('UPDATE sessions SET csrf_token_hash=$2 WHERE id=$1', [req.sessionId, csrfHash]);
  res.json({ user: { ...req.user, csrfToken } });
}));
router.post('/auth/change-password', requireAuth, asyncRoute(changePassword));

const roleSchema = z.enum(['Administrador', 'Codificador', 'Consulta']);
router.get('/users', requireRoles('Administrador'), asyncRoute(async (_req, res) => {
  const result = await getPool().query(`SELECT id,name,login,email,role,active,must_change_password AS "mustChangePassword",
    failed_login_attempts AS "failedLoginAttempts",locked_until AS "lockedUntil",last_access_at AS "lastAccessAt",
    created_at AS "createdAt",updated_at AS "updatedAt" FROM users ORDER BY name`);
  res.json({ items: result.rows });
}));
router.post('/users', requireRoles('Administrador'), asyncRoute(async (req, res) => {
  const parsed = z.object({ name: z.string().min(2).max(120), login: z.string().min(3).max(80), email: z.string().email().optional().or(z.literal('')), role: roleSchema, temporaryPassword: z.string() }).parse(req.body);
  const error = passwordError(parsed.temporaryPassword); if (error) return res.status(400).json({ error });
  const hash = await hashPassword(parsed.temporaryPassword);
  const created = await transaction(async (client) => {
    const result = await client.query(`INSERT INTO users(name,login,email,password_hash,role,must_change_password)
      VALUES ($1,$2,$3,$4,$5,true) RETURNING id,name,login,email,role,active,must_change_password AS "mustChangePassword"`,
    [parsed.name.trim(), normalizeLogin(parsed.login), parsed.email || null, hash, parsed.role]);
    await audit(client, 'USER_CREATED', 'user', result.rows[0].id, req.user, { after: result.rows[0], ip: req.ip });
    return result.rows[0];
  });
  res.status(201).json({ user: created });
}));
router.patch('/users/:id', requireRoles('Administrador'), asyncRoute(async (req, res) => {
  const parsed = z.object({ name: z.string().min(2).max(120).optional(), role: roleSchema.optional(), active: z.boolean().optional(), email: z.string().email().nullable().optional() }).parse(req.body);
  if (req.params.id === req.user!.id && parsed.active === false) return res.status(400).json({ error: 'O administrador conectado não pode inativar a própria conta.' });
  const updated = await transaction(async (client) => {
    const before = await client.query('SELECT id,name,email,role,active FROM users WHERE id=$1', [req.params.id]);
    if (!before.rows[0]) return null;
    const result = await client.query(`UPDATE users SET name=COALESCE($2,name),email=CASE WHEN $3::boolean THEN $4 ELSE email END,
      role=COALESCE($5,role),active=COALESCE($6,active),updated_at=now() WHERE id=$1
      RETURNING id,name,login,email,role,active,must_change_password AS "mustChangePassword"`,
    [req.params.id, parsed.name || null, Object.hasOwn(parsed, 'email'), parsed.email ?? null, parsed.role || null, parsed.active ?? null]);
    if (parsed.active === false) await client.query('DELETE FROM sessions WHERE user_id=$1', [req.params.id]);
    await audit(client, parsed.active === false ? 'USER_DEACTIVATED' : parsed.active === true ? 'USER_ACTIVATED' : 'USER_UPDATED', 'user', String(req.params.id), req.user, { before: before.rows[0], after: result.rows[0], ip: req.ip });
    return result.rows[0];
  });
  if (!updated) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ user: updated });
}));
router.post('/users/:id/reset-password', requireRoles('Administrador'), asyncRoute(async (req, res) => {
  const password = String(req.body?.temporaryPassword || ''); const error = passwordError(password);
  if (error) return res.status(400).json({ error });
  const passwordHash = await hashPassword(password);
  await transaction(async (client) => {
    const result = await client.query('UPDATE users SET password_hash=$2,must_change_password=true,failed_login_attempts=0,locked_until=NULL,updated_at=now() WHERE id=$1 RETURNING id', [req.params.id, passwordHash]);
    if (!result.rowCount) throw Object.assign(new Error('Usuário não encontrado.'), { status: 404 });
    await client.query('DELETE FROM sessions WHERE user_id=$1', [req.params.id]);
    await audit(client, 'PASSWORD_RESET', 'user', String(req.params.id), req.user, { ip: req.ip });
  });
  res.json({ ok: true });
}));

router.get('/codes', requireAuth, asyncRoute(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1)); const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 25)));
  const search = String(req.query.search || '').trim(); const nature = String(req.query.nature || ''); const category = String(req.query.category || ''); const status = String(req.query.status || '');
  const params: unknown[] = []; const where: string[] = [];
  if (search) { params.push(`%${search}%`); where.push(`(s.sap_code ILIKE $${params.length} OR s.standardized_description ILIKE $${params.length} OR s.tag ILIKE $${params.length} OR s.model ILIKE $${params.length})`); }
  if (nature) { params.push(nature); where.push(`s.nature_id=$${params.length}`); }
  if (category) { params.push(category); where.push(`s.category_id=$${params.length}`); }
  if (status) { params.push(status); where.push(`s.status=$${params.length}`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = await getPool().query(`SELECT count(*)::int AS total FROM sap_codes s ${clause}`, params);
  params.push(pageSize, (page - 1) * pageSize);
  const result = await getPool().query(`SELECT s.id,s.sap_code AS "sapCode",s.standardized_description AS description,n.name AS nature,
    c.name AS category,s.tag,s.model,s.status,s.created_at AS "createdAt" FROM sap_codes s JOIN natures n ON n.id=s.nature_id
    JOIN categories c ON c.id=s.category_id ${clause} ORDER BY s.created_at DESC,s.sap_code LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  res.json({ items: result.rows, page, pageSize, total: total.rows[0].total });
}));
router.get('/codes/export', requireRoles('Administrador', 'Codificador'), asyncRoute(async (req, res) => {
  const buffer = await exportDatabase(req.user!, req.ip);
  res.setHeader('Content-Disposition', 'attachment; filename="Banco_de_Dados_Codigos_SAP.xlsx"');
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(buffer);
}));
router.get('/codes/:id', requireAuth, asyncRoute(async (req, res) => {
  const result = await getPool().query(`SELECT s.*,n.name AS nature,c.name AS category FROM sap_codes s
    JOIN natures n ON n.id=s.nature_id JOIN categories c ON c.id=s.category_id WHERE s.id=$1`, [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Código não encontrado.' });
  res.json({ item: result.rows[0] });
}));
const codeSchema = z.object({ categoryId: z.string().uuid(), attributes: z.record(z.string(), z.string()), description: z.string().max(1000).optional(), origin: z.string().max(80).optional(), unit: z.string().max(80).optional(), manufacturer: z.string().max(200).optional(), model: z.string().max(200).optional(), tag: z.string().max(200).optional(), ncp: z.string().max(200).optional(), project: z.string().max(200).optional(), serialNumber: z.string().max(200).optional(), notes: z.string().max(2000).optional() });
router.post('/codes/preview', requireRoles('Administrador', 'Codificador'), asyncRoute(async (req, res) => res.json(await previewCode(codeSchema.parse(req.body)))));
router.post('/codes', requireRoles('Administrador', 'Codificador'), asyncRoute(async (req, res) => res.status(201).json({ item: await createCode(codeSchema.parse(req.body), req.user!, req.ip) })));
router.post('/codes/batch/validate', requireRoles('Administrador', 'Codificador'), asyncRoute(async (req, res) => {
  const items = z.array(codeSchema).min(1).max(500).parse(req.body?.items); const results = []; const keys = new Set<string>();
  for (let index = 0; index < items.length; index += 1) {
    try { const preview = await previewCode(items[index]); if (keys.has(preview.technicalKey)) throw new Error('Duplicidade dentro do lote.'); keys.add(preview.technicalKey); results.push({ index, valid: true, ...preview }); }
    catch (error: any) { results.push({ index, valid: false, error: error.message }); }
  }
  res.json({ items: results, valid: results.every((item) => item.valid) });
}));
router.post('/codes/batch/confirm', requireRoles('Administrador', 'Codificador'), asyncRoute(async (req, res) => {
  const items = z.array(codeSchema).min(1).max(500).parse(req.body?.items);
  res.status(201).json({ items: await createBatch(items, req.user!, req.ip) });
}));

router.get('/natures', requireAuth, asyncRoute(async (_req, res) => { const result = await getPool().query('SELECT id,name,code,active FROM natures ORDER BY name'); res.json({ items: result.rows }); }));
router.get('/categories', requireAuth, asyncRoute(async (req, res) => {
  const nature = String(req.query.nature || ''); const result = await getPool().query(`SELECT c.id,c.nature_id AS "natureId",n.name AS nature,n.code AS "natureCode",c.name,c.base_code AS "baseCode",c.description_format AS "descriptionFormat",c.characteristic_1 AS "characteristic1",c.characteristic_2 AS "characteristic2",c.code_formula AS "codeFormula",c.required_fields AS "requiredFields",c.example,c.active FROM categories c JOIN natures n ON n.id=c.nature_id WHERE ($1='' OR n.id::text=$1) ORDER BY c.name,n.name`, [nature]); res.json({ items: result.rows });
}));
router.get('/category-search', requireAuth, asyncRoute(async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.json({ items: [] });
  const result = await getPool().query(`SELECT c.id,c.nature_id AS "natureId",n.name AS nature,n.code AS "natureCode",c.name,
    c.base_code AS "baseCode",c.description_format AS "descriptionFormat",c.characteristic_1 AS "characteristic1",
    c.characteristic_2 AS "characteristic2",c.code_formula AS "codeFormula",c.required_fields AS "requiredFields",c.example,c.active
    FROM categories c JOIN natures n ON n.id=c.nature_id WHERE n.active=true`);
  res.json({ items: searchCategories(result.rows, query) });
}));
router.get('/categories/:id/fields', requireAuth, asyncRoute(async (req, res) => {
  const categoryResult = await getPool().query(`SELECT c.id,c.nature_id AS "natureId",n.name AS nature,n.code AS "natureCode",c.name,
    c.base_code AS "baseCode",c.description_format AS "descriptionFormat",c.characteristic_1 AS "characteristic1",
    c.characteristic_2 AS "characteristic2",c.code_formula AS "codeFormula",c.required_fields AS "requiredFields",c.example,c.active
    FROM categories c JOIN natures n ON n.id=c.nature_id WHERE c.id=$1`, [req.params.id]);
  if (!categoryResult.rows[0]) return res.status(404).json({ error: 'Categoria não encontrada.' });
  const referenceResult = await getPool().query(`SELECT reference_group AS "group",description,code,active
    FROM technical_references WHERE active=true ORDER BY reference_group,description`);
  res.json({ items: fieldDefinitions(categoryResult.rows[0], referenceResult.rows) });
}));
router.get('/references', requireAuth, asyncRoute(async (req, res) => { const group = String(req.query.group || ''); const result = await getPool().query(`SELECT id,reference_group AS "group",description,code,active,notes FROM technical_references WHERE ($1='' OR reference_group=$1) ORDER BY reference_group,description`, [group]); res.json({ items: result.rows }); }));

router.post('/categories', requireRoles('Administrador'), asyncRoute(async (req, res) => {
  const p = z.object({ natureId: z.string().uuid(), name: z.string().min(2), baseCode: z.string().regex(/^[A-Z0-9]{4}$/), descriptionFormat: z.string().min(1), characteristic1: z.string().default(''), characteristic2: z.string().default(''), codeFormula: z.string().default(''), requiredFields: z.array(z.string()).min(1), example: z.string().default('') }).parse(req.body);
  const item = await transaction(async (client) => { const result = await client.query(`INSERT INTO categories(nature_id,name,base_code,description_format,characteristic_1,characteristic_2,code_formula,required_fields,example) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [p.natureId,p.name,p.baseCode,p.descriptionFormat,p.characteristic1,p.characteristic2,p.codeFormula,JSON.stringify(p.requiredFields),p.example]); await audit(client,'CATEGORY_CREATED','category',result.rows[0].id,req.user,{after:result.rows[0],ip:req.ip}); return result.rows[0]; }); res.status(201).json({ item });
}));
router.patch('/categories/:id', requireRoles('Administrador'), asyncRoute(async (req, res) => {
  const p = z.object({ active: z.boolean().optional(), descriptionFormat: z.string().min(1).optional(), requiredFields: z.array(z.string()).min(1).optional(), example: z.string().optional() }).parse(req.body);
  const item = await transaction(async (client) => { const before=await client.query('SELECT * FROM categories WHERE id=$1',[req.params.id]); if(!before.rows[0])throw Object.assign(new Error('Categoria não encontrada.'),{status:404}); const result=await client.query(`UPDATE categories SET active=COALESCE($2,active),description_format=COALESCE($3,description_format),required_fields=COALESCE($4,required_fields),example=COALESCE($5,example),updated_at=now() WHERE id=$1 RETURNING *`,[req.params.id,p.active??null,p.descriptionFormat??null,p.requiredFields?JSON.stringify(p.requiredFields):null,p.example??null]); await audit(client,'CATEGORY_UPDATED','category',String(req.params.id),req.user,{before:before.rows[0],after:result.rows[0],ip:req.ip}); return result.rows[0]; }); res.json({ item });
}));
router.post('/references', requireRoles('Administrador'), asyncRoute(async (req, res) => {
  const p=z.object({group:z.string().min(1),description:z.string().min(1),code:z.string().max(3).default(''),notes:z.string().default('')}).parse(req.body); const item=await transaction(async(client)=>{const result=await client.query('INSERT INTO technical_references(reference_group,description,code,notes) VALUES ($1,$2,$3,$4) RETURNING *',[p.group,p.description,p.code.toUpperCase(),p.notes]);await audit(client,'REFERENCE_CREATED','reference',result.rows[0].id,req.user,{after:result.rows[0],ip:req.ip});return result.rows[0]});res.status(201).json({item});
}));
router.patch('/references/:id', requireRoles('Administrador'), asyncRoute(async(req,res)=>{const p=z.object({active:z.boolean().optional(),description:z.string().min(1).optional(),code:z.string().max(3).optional(),notes:z.string().optional()}).parse(req.body);const item=await transaction(async(client)=>{const before=await client.query('SELECT * FROM technical_references WHERE id=$1',[req.params.id]);if(!before.rows[0])throw Object.assign(new Error('Referência não encontrada.'),{status:404});const result=await client.query(`UPDATE technical_references SET active=COALESCE($2,active),description=COALESCE($3,description),code=COALESCE($4,code),notes=COALESCE($5,notes),updated_at=now() WHERE id=$1 RETURNING *`,[req.params.id,p.active??null,p.description??null,p.code?.toUpperCase()??null,p.notes??null]);await audit(client,'REFERENCE_UPDATED','reference',String(req.params.id),req.user,{before:before.rows[0],after:result.rows[0],ip:req.ip});return result.rows[0]});res.json({item});}));

router.post('/admin/import/validate', requireRoles('Administrador'), upload.single('file'), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie um arquivo XLSX.' });
  if (!/\.xlsx?$/i.test(req.file.originalname)) return res.status(400).json({ error: 'Formato de arquivo não permitido.' });
  res.json(await analyzeWorkbookAgainstDatabase(req.file.buffer, req.file.originalname));
}));
router.post('/admin/import/confirm', requireRoles('Administrador'), upload.single('file'), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Envie novamente o arquivo validado.' }); const expectedHash=String(req.body?.fileHash||''); if(!/^[a-f0-9]{64}$/.test(expectedHash))return res.status(400).json({error:'Hash de validação inválido.'}); res.status(201).json({result:await importWorkbook(req.file.buffer,req.file.originalname,expectedHash,req.user!,req.ip)});
}));
router.get('/audit', requireRoles('Administrador'), asyncRoute(async (req,res)=>{const page=Math.max(1,Number(req.query.page||1));const size=Math.min(100,Math.max(1,Number(req.query.pageSize||50)));const result=await getPool().query(`SELECT id,actor_name AS "actorName",action,entity_type AS "entityType",entity_id AS "entityId",before_data AS "beforeData",after_data AS "afterData",details,ip_address AS "ipAddress",created_at AS "createdAt" FROM audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2`,[size,(page-1)*size]);res.json({items:result.rows,page,pageSize:size});}));

export default router;
