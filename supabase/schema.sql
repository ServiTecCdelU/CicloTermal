-- =============================================================
-- CICLO TERMAL — Schema Supabase
-- Migración desde Firebase Firestore
-- =============================================================

-- admins
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  photo_url text,
  role text NOT NULL DEFAULT 'pending',
  login_method text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- participantes (PK = dni, igual que en Firestore)
CREATE TABLE IF NOT EXISTS participantes (
  dni text PRIMARY KEY,
  nombre text,
  apellido text,
  email text,
  telefono text,
  pais_telefono text,
  telefono_emergencia text,
  pais_telefono_emergencia text,
  fecha_nacimiento text,
  localidad text,
  grupo_sanguineo text,
  genero text,
  grupo_ciclistas text,
  talle_remera text,
  condiciones_salud jsonb,
  es_celiaco text,
  nombre_transferencia text,
  precio text,
  transfirio_a text,
  estado text,
  años int[],
  fecha_inscripcion timestamptz DEFAULT now(),
  acepta_condiciones boolean DEFAULT false,
  comprobante_pago_url text
);

-- gastos (reemplaza gastos2025, con columna year)
CREATE TABLE IF NOT EXISTS gastos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto text,
  monto numeric,
  categoria text,
  descripcion text,
  pagado_por text,
  fecha timestamptz DEFAULT now(),
  year int
);

-- settings (clave = 'eventSettings' | 'confirmacion' | 'remera')
CREATE TABLE IF NOT EXISTS settings (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'
);

-- configuracion (clave = 'inscripciones' | 'grupos')
CREATE TABLE IF NOT EXISTS configuracion (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'
);

-- benefits
CREATE TABLE IF NOT EXISTS benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  year int,
  "order" int DEFAULT 0,
  label text,
  value text,
  icon_name text,
  icon_type text,
  text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- historia
CREATE TABLE IF NOT EXISTS historia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  image_url text,
  logo_url text,
  contact_link text,
  "order" int DEFAULT 0,
  year int,
  created_at timestamptz DEFAULT now()
);

-- jersey (documento único, id siempre = 'info')
CREATE TABLE IF NOT EXISTS jersey (
  id text PRIMARY KEY DEFAULT 'info',
  title text,
  description text,
  image_url text,
  show_section boolean DEFAULT true,
  year int,
  call_to_action_title text,
  call_to_action_description text,
  features jsonb DEFAULT '[]'
);

-- contacto (documento único, id siempre = 'info')
CREATE TABLE IF NOT EXISTS contacto (
  id text PRIMARY KEY DEFAULT 'info',
  address text,
  phones jsonb DEFAULT '[]',
  email text,
  links jsonb DEFAULT '[]',
  map_url text,
  show_map boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- galeria_fotos
CREATE TABLE IF NOT EXISTS galeria_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  year int,
  "order" int DEFAULT 0,
  image_url text,
  description text,
  name text,
  link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- remera
CREATE TABLE IF NOT EXISTS remera (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dni text,
  nombre text,
  telefono text,
  items jsonb DEFAULT '[]',
  talle text,
  tiene_comprobante boolean DEFAULT false,
  esta_registrado boolean DEFAULT false,
  estado text DEFAULT 'pendiente',
  fecha_solicitud text
);

-- remera_comprobantes
CREATE TABLE IF NOT EXISTS remera_comprobantes (
  id text PRIMARY KEY,
  comprobante_base64 text
);

-- itinerario (PK = '{year}_{day}', ej: '2025_sabado')
CREATE TABLE IF NOT EXISTS itinerario (
  id text PRIMARY KEY,
  day text,
  title text,
  time text,
  subtitle text,
  content text,
  year int,
  updated_at timestamptz DEFAULT now()
);

-- carousel
CREATE TABLE IF NOT EXISTS carousel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  title text,
  subtitle text,
  button_text text,
  button_url text,
  "order" int DEFAULT 0,
  year int
);

-- sponsors
CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  website text,
  image_base64 text,
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- =============================================================
-- ÍNDICES para queries frecuentes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_benefits_type_year ON benefits (type, year);
CREATE INDEX IF NOT EXISTS idx_galeria_year_type ON galeria_fotos (year, type);
CREATE INDEX IF NOT EXISTS idx_carousel_year ON carousel (year);
CREATE INDEX IF NOT EXISTS idx_historia_year ON historia (year);
CREATE INDEX IF NOT EXISTS idx_itinerario_year ON itinerario (year);
CREATE INDEX IF NOT EXISTS idx_gastos_year ON gastos (year);
CREATE INDEX IF NOT EXISTS idx_participantes_años ON participantes USING GIN (años);

-- =============================================================
-- RLS — Row Level Security
-- =============================================================

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE historia ENABLE ROW LEVEL SECURITY;
ALTER TABLE jersey ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacto ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE remera ENABLE ROW LEVEL SECURITY;
ALTER TABLE remera_comprobantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerario ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

-- Lectura pública (anon puede leer datos del sitio)
CREATE POLICY "public_read" ON benefits FOR SELECT USING (true);
CREATE POLICY "public_read" ON historia FOR SELECT USING (true);
CREATE POLICY "public_read" ON jersey FOR SELECT USING (true);
CREATE POLICY "public_read" ON contacto FOR SELECT USING (true);
CREATE POLICY "public_read" ON galeria_fotos FOR SELECT USING (true);
CREATE POLICY "public_read" ON sponsors FOR SELECT USING (true);
CREATE POLICY "public_read" ON carousel FOR SELECT USING (true);
CREATE POLICY "public_read" ON itinerario FOR SELECT USING (true);
CREATE POLICY "public_read" ON settings FOR SELECT USING (true);
CREATE POLICY "public_read" ON configuracion FOR SELECT USING (true);

-- Las escrituras y datos sensibles usan service_role (bypass RLS)
-- No se necesitan políticas adicionales: el service_role key bypasea RLS automáticamente
