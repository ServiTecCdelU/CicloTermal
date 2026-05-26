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
CREATE POLICY "public_read" ON form_fields FOR SELECT USING (true);
