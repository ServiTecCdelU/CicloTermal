-- =============================================================
-- MIGRACIONES ADICIONALES
-- Ejecutar en Supabase SQL Editor después de schema.sql
-- =============================================================

-- Columnas faltantes en participantes (usadas por admin-registrations-page)
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS email_enviado boolean DEFAULT false;
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS fecha_email_enviado timestamptz;
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS fecha_actualizacion timestamptz;
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS nota text;
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS numero_inscripcion int;
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS recorrido text;

-- Columnas faltantes en remera (envío a domicilio + comprobante Storage)
ALTER TABLE remera ADD COLUMN IF NOT EXISTS envio_tipo text DEFAULT 'retiro';
ALTER TABLE remera ADD COLUMN IF NOT EXISTS direccion text;
ALTER TABLE remera ADD COLUMN IF NOT EXISTS comprobante_url text;

-- Índice único en remera.dni para permitir upsert (pedir-remera)
CREATE UNIQUE INDEX IF NOT EXISTS remera_dni_unique ON remera (dni) WHERE dni IS NOT NULL;

-- Tabla form_fields (editor de campos del formulario)
CREATE TABLE IF NOT EXISTS form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text,
  type text,
  required boolean DEFAULT false,
  "order" int DEFAULT 0,
  options jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read" ON form_fields;
CREATE POLICY "public_read" ON form_fields FOR SELECT USING (true);

-- Columna updated_at faltante en tablas que los editors la envían
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE historia ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE jersey ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE carousel ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Tabla bike_friendly
CREATE TABLE IF NOT EXISTS bike_friendly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text DEFAULT '',
  image_base64 text DEFAULT '',
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE bike_friendly ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- POLÍTICAS DE ESCRITURA (anon puede escribir)
-- Los editors usan el browser client (anon key).
-- La protección real es Firebase Auth en el layout de /admin.
-- =============================================================

-- Tablas de contenido del sitio (no sensibles)
DROP POLICY IF EXISTS "anon_write" ON benefits;
CREATE POLICY "anon_write" ON benefits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON historia;
CREATE POLICY "anon_write" ON historia FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON jersey;
CREATE POLICY "anon_write" ON jersey FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON contacto;
CREATE POLICY "anon_write" ON contacto FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON galeria_fotos;
CREATE POLICY "anon_write" ON galeria_fotos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON sponsors;
CREATE POLICY "anon_write" ON sponsors FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON carousel;
CREATE POLICY "anon_write" ON carousel FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON itinerario;
CREATE POLICY "anon_write" ON itinerario FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON settings;
CREATE POLICY "anon_write" ON settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON configuracion;
CREATE POLICY "anon_write" ON configuracion FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON form_fields;
CREATE POLICY "anon_write" ON form_fields FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON bike_friendly;
CREATE POLICY "anon_write" ON bike_friendly FOR ALL USING (true) WITH CHECK (true);

-- Tablas operativas (también necesitan escritura desde admin)
DROP POLICY IF EXISTS "anon_write" ON participantes;
CREATE POLICY "anon_write" ON participantes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON gastos;
CREATE POLICY "anon_write" ON gastos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON remera;
CREATE POLICY "anon_write" ON remera FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_write" ON remera_comprobantes;
CREATE POLICY "anon_write" ON remera_comprobantes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read" ON admins;
CREATE POLICY "anon_read" ON admins FOR SELECT USING (true);
