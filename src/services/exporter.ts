import * as XLSX from 'xlsx';
import type { AuthUser } from '../types.js';
import { getPool, transaction } from '../db.js';
import { audit } from '../audit.js';

export async function exportDatabase(user: AuthUser, ip?: string): Promise<Buffer> {
  const pool = getPool();
  const [codes, categories, references, history] = await Promise.all([
    pool.query(`SELECT s.sap_code AS "CodigoSAP", s.standardized_description AS "DescricaoPadronizada",
      n.name AS "Natureza", s.nature_code AS "CodigoNatureza", c.name AS "Categoria", s.category_code AS "CodigoCategoria",
      s.characteristic_1 AS "Caracteristica1", s.characteristic_1_code AS "CodigoCaracteristica1",
      s.characteristic_2 AS "Caracteristica2", s.characteristic_2_code AS "CodigoCaracteristica2",
      s.sequential AS "Sequencial", '' AS "DigitoVerificador", s.sequential_rule AS "RegraSequencial",
      s.technical_key AS "ChaveTecnica", s.origin AS "Origem", s.unit AS "Unidade", s.manufacturer AS "Fabricante",
      s.model AS "Modelo", s.tag AS "TAG", s.ncp AS "NCPProjeto", s.project AS "Projeto", s.serial_number AS "NumeroSerie",
      s.notes AS "Observacao", s.created_at AS "DataCriacao", s.updated_at AS "DataAlteracao",
      COALESCE(u.name,'Sistema') AS "Responsavel", s.status AS "Situacao"
      FROM sap_codes s JOIN natures n ON n.id=s.nature_id JOIN categories c ON c.id=s.category_id
      LEFT JOIN users u ON u.id=s.created_by ORDER BY s.created_at,s.sap_code`),
    pool.query(`SELECT n.name AS "Natureza", c.name AS "Categoria", c.base_code AS "CodigoBase",
      c.description_format AS "FormatoDescricao", c.characteristic_1 AS "Caracteristica1", c.characteristic_2 AS "Caracteristica2",
      c.code_formula AS "FormulaCodigo", array_to_string(ARRAY(SELECT jsonb_array_elements_text(c.required_fields)), '; ') AS "CamposObrigatorios",
      c.example AS "Exemplo", CASE WHEN c.active THEN 'Ativo' ELSE 'Inativo' END AS "Situacao"
      FROM categories c JOIN natures n ON n.id=c.nature_id ORDER BY n.name,c.name`),
    pool.query(`SELECT reference_group AS "Grupo", description AS "Descricao", code AS "Codigo",
      CASE WHEN active THEN 'Ativo' ELSE 'Inativo' END AS "Situacao", notes AS "Observacao"
      FROM technical_references ORDER BY reference_group,description`),
    pool.query(`SELECT created_at AS "DataHora", actor_name AS "Usuario", action AS "Acao", entity_id AS "CodigoSAP",
      COALESCE(before_data::text,'') AS "ValorAnterior", COALESCE(after_data::text,'') AS "ValorNovo",
      COALESCE(details::text,'') AS "Observacao" FROM audit_log ORDER BY created_at`),
  ]);
  const workbook = XLSX.utils.book_new();
  for (const [name, rows] of [['Codigos', codes.rows], ['Categorias', categories.rows], ['Referencias', references.rows], ['Historico', history.rows]] as const) {
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet['!autofilter'] = { ref: sheet['!ref'] || 'A1:A1' };
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  const output = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true }) as Buffer;
  await transaction((client) => audit(client, 'DATABASE_EXPORTED', 'export', '', user, { details: { codes: codes.rowCount }, ip }));
  return output;
}
