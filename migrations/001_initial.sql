CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  login text NOT NULL,
  email text,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('Administrador', 'Codificador', 'Consulta')),
  active boolean NOT NULL DEFAULT true,
  must_change_password boolean NOT NULL DEFAULT true,
  failed_login_attempts integer NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
  locked_until timestamptz,
  last_access_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_login_unique UNIQUE (login),
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  csrf_token_hash text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS natures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code varchar(2) NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{2}$'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nature_id uuid NOT NULL REFERENCES natures(id),
  name text NOT NULL,
  base_code varchar(4) NOT NULL CHECK (base_code ~ '^[A-Z0-9]{4}$'),
  description_format text NOT NULL,
  characteristic_1 text NOT NULL DEFAULT '',
  characteristic_2 text NOT NULL DEFAULT '',
  code_formula text NOT NULL DEFAULT '',
  required_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  example text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (nature_id, name),
  UNIQUE (base_code)
);
CREATE INDEX IF NOT EXISTS categories_nature_idx ON categories(nature_id);

CREATE TABLE IF NOT EXISTS technical_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_group text NOT NULL,
  description text NOT NULL,
  code varchar(3) NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reference_group, description)
);

CREATE TABLE IF NOT EXISTS sequential_counters (
  structural_prefix varchar(8) PRIMARY KEY CHECK (structural_prefix ~ '^[A-Z0-9]{8}$'),
  last_value integer NOT NULL DEFAULT 0 CHECK (last_value BETWEEN 0 AND 999999),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sap_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sap_code text NOT NULL,
  canonical_code text NOT NULL,
  standardized_description text NOT NULL,
  nature_id uuid NOT NULL REFERENCES natures(id),
  nature_code varchar(2) NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id),
  category_code text NOT NULL DEFAULT '',
  characteristic_1 text NOT NULL DEFAULT '',
  characteristic_1_code text NOT NULL DEFAULT '',
  characteristic_2 text NOT NULL DEFAULT '',
  characteristic_2_code text NOT NULL DEFAULT '',
  sequential varchar(6) NOT NULL DEFAULT '',
  verification_digit text NOT NULL DEFAULT '' CHECK (verification_digit = ''),
  sequential_rule text NOT NULL DEFAULT '',
  technical_key text,
  origin text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  manufacturer text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  tag text NOT NULL DEFAULT '',
  ncp text NOT NULL DEFAULT '',
  project text NOT NULL DEFAULT '',
  serial_number text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Provisório',
  source text NOT NULL DEFAULT 'Aplicação',
  technical_attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id),
  updated_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sap_codes_canonical_unique UNIQUE (canonical_code),
  CONSTRAINT sap_codes_new_sequence CHECK (sequential = '' OR sequential ~ '^\d{6}$')
);
CREATE UNIQUE INDEX IF NOT EXISTS sap_codes_technical_unique
  ON sap_codes (nature_id, technical_key)
  WHERE technical_key IS NOT NULL AND technical_key <> '' AND status IN ('Ativo', 'Aprovado', 'Provisório');
CREATE INDEX IF NOT EXISTS sap_codes_search_idx ON sap_codes(category_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS sap_codes_description_idx ON sap_codes USING gin(to_tsvector('simple', standardized_description));

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  actor_name text NOT NULL DEFAULT '',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL DEFAULT '',
  before_data jsonb,
  after_data jsonb,
  details jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS database_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_hash char(64) NOT NULL UNIQUE,
  status text NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  imported_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

INSERT INTO natures(name, code) VALUES
 ('Revenda','RE'), ('Matéria Prima','MP'), ('Embalagem','EM'),
 ('Produto Em Processo','PP'), ('Produto Acabado','PA'), ('Sub Produto','SB'),
 ('Produto Intermediário','PI'), ('Uso e Consumo','UC'),
 ('Ativo Imobilizado','AI'), ('Serviços','SE'), ('Insumos','IN'), ('Outros','OT')
ON CONFLICT DO NOTHING;
