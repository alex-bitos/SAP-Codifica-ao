-- A V3.11 ignora aliases antigos de Flange Cover. Os registros são preservados,
-- mas ficam inativos para não aparecerem como opções operacionais duplicadas.
UPDATE technical_references
SET active=false, updated_at=now()
WHERE lower(reference_group) IN (
  'flange cover modelo',
  'flange cover norma',
  'diametro flange cover',
  'diâmetro flange cover',
  'flange cover classe de pressao'
)
OR lower(notes) LIKE '%incluida para flange cover%'
OR lower(notes) LIKE '%incluída para flange cover%';
