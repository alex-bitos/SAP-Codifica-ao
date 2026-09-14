-- Completa a normalização da V3.11 em bancos importados antes da camada de
-- paridade. Nenhum registro é excluído: aliases redundantes ficam inativos.

-- Os modelos do Flange Cover são versionados na regra de domínio. As seis
-- cópias antigas no catálogo PostgreSQL não fazem parte das 574 referências
-- efetivas extraídas da V3.11.
UPDATE technical_references
SET active=false, updated_at=now()
WHERE active=true
  AND lower(replace(reference_group, ' ', '')) = 'flangecover:modelo';

-- O catálogo ampliado antigo repetiu 21 diâmetros em dois grupos semânticos.
-- A V3.11 conserva, para esses valores, o grupo específico de fio para malha.
UPDATE technical_references AS generic
SET active=false, updated_at=now()
WHERE generic.active=true
  AND lower(generic.reference_group) = 'diâmetro de fio'
  AND EXISTS (
    SELECT 1
    FROM technical_references AS mesh
    WHERE mesh.active=true
      AND lower(mesh.reference_group) = 'diametro de fio para malha'
      AND lower(mesh.description) = lower(generic.description)
  );
