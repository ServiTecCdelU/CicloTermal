-- =============================================================
-- Endurecimiento de RLS
--
-- Problema: las políticas "anon_write"/"anon_read" (migrations.sql)
-- permiten a CUALQUIERA con la anon key (que es pública, viaja en el
-- bundle JS) leer y escribir participantes, gastos, remera y admins,
-- sin siquiera iniciar sesión.
--
-- Solución: acceso a datos sensibles solo para usuarios autenticados
-- que figuren en la tabla admins con role 'admin' (o 'remera' para las
-- tablas de remera). Las escrituras públicas (inscripción, pedido de
-- remera) ya pasan por API routes con service_role, que bypasea RLS.
--
-- Ejecutar en el SQL editor de Supabase.
-- =============================================================

-- -------------------------------------------------------------
-- Helpers
-- -------------------------------------------------------------

-- SECURITY DEFINER para poder leer admins sin disparar RLS sobre admins.
CREATE OR REPLACE FUNCTION public.current_admin_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.role
  FROM admins a
  WHERE a.email = (auth.jwt() ->> 'email')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_admin_role() = 'admin';
$$;

-- Admin completo o rol acotado a remera.
CREATE OR REPLACE FUNCTION public.is_remera_staff()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.current_admin_role() IN ('admin', 'remera');
$$;

-- -------------------------------------------------------------
-- Datos sensibles: solo admin
-- -------------------------------------------------------------

ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_write" ON participantes;
DROP POLICY IF EXISTS "public_read" ON participantes;
DROP POLICY IF EXISTS "admin_all" ON participantes;
CREATE POLICY "admin_all" ON participantes FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_write" ON gastos;
DROP POLICY IF EXISTS "public_read" ON gastos;
DROP POLICY IF EXISTS "admin_all" ON gastos;
CREATE POLICY "admin_all" ON gastos FOR ALL
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- -------------------------------------------------------------
-- Remera: admin + rol 'remera'
-- -------------------------------------------------------------

ALTER TABLE remera ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_write" ON remera;
DROP POLICY IF EXISTS "public_read" ON remera;
DROP POLICY IF EXISTS "staff_all" ON remera;
CREATE POLICY "staff_all" ON remera FOR ALL
  TO authenticated USING (public.is_remera_staff()) WITH CHECK (public.is_remera_staff());

ALTER TABLE remera_comprobantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_write" ON remera_comprobantes;
DROP POLICY IF EXISTS "public_read" ON remera_comprobantes;
DROP POLICY IF EXISTS "staff_all" ON remera_comprobantes;
CREATE POLICY "staff_all" ON remera_comprobantes FOR ALL
  TO authenticated USING (public.is_remera_staff()) WITH CHECK (public.is_remera_staff());

-- -------------------------------------------------------------
-- admins: cada usuario ve solo su fila; el admin ve todas.
-- El alta como 'pending' en el primer login sigue permitida,
-- pero solo con el propio email y solo con role = 'pending'.
-- -------------------------------------------------------------

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read" ON admins;
DROP POLICY IF EXISTS "anon_write" ON admins;
DROP POLICY IF EXISTS "public_read" ON admins;
DROP POLICY IF EXISTS "self_read" ON admins;
DROP POLICY IF EXISTS "self_insert_pending" ON admins;
DROP POLICY IF EXISTS "admin_manage" ON admins;

CREATE POLICY "self_read" ON admins FOR SELECT
  TO authenticated USING (email = (auth.jwt() ->> 'email') OR public.is_admin());

CREATE POLICY "self_insert_pending" ON admins FOR INSERT
  TO authenticated WITH CHECK (email = (auth.jwt() ->> 'email') AND role = 'pending');

CREATE POLICY "admin_manage" ON admins FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "admin_delete" ON admins FOR DELETE
  TO authenticated USING (public.is_admin());

-- -------------------------------------------------------------
-- Contenido del sitio: lectura pública, escritura solo admin.
-- -------------------------------------------------------------

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'benefits', 'historia', 'jersey', 'contacto', 'galeria_fotos',
    'sponsors', 'carousel', 'itinerario', 'settings', 'configuracion',
    'form_fields', 'bike_friendly'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_write" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "public_read" ON %I', t);
    EXECUTE format('DROP POLICY IF EXISTS "admin_write" ON %I', t);

    EXECUTE format('CREATE POLICY "public_read" ON %I FOR SELECT USING (true)', t);
    EXECUTE format(
      'CREATE POLICY "admin_write" ON %I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t
    );
  END LOOP;
END $$;
