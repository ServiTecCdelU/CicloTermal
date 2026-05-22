# Plan de Migración: Firebase → Supabase

## Contexto

**Objetivo:** Reemplazar Firestore + Firebase Auth por Supabase (PostgreSQL + Auth), manteniendo toda la funcionalidad existente sin romper nada.  
**Rama de trabajo:** `prueba`  
**Deploy target:** https://ciclo-turismo.vercel.app  
**Supabase proyecto:** `czhrucrrasgwhqpqivfb` (sa-east-1)

---

## Colecciones a migrar

| Firestore | Tabla Supabase | Notas |
|---|---|---|
| `admins` | `admins` | Roles: admin, remera, pending |
| `participantesCicloTermal` | `participantes` | PK = DNI |
| `gastos2025` | `gastos` | Se agrega columna `year` |
| `settings` (subdocs) | `settings` | Modelo clave-valor con `id` + `data jsonb` |
| `configuracion` (subdocs) | `configuracion` | Igual que settings |
| `benefits` | `benefits` | |
| `historia` | `historia` | |
| `jersey` | `jersey` | Doc único id='info' |
| `contacto` | `contacto` | Doc único id='info' |
| `galeriaFotos` | `galeria_fotos` | |
| `remera` | `remera` | |
| `remera_comprobantes` | `remera_comprobantes` | Base64 de comprobantes |
| `itinerario` | `itinerario` | PK = `{year}_{day}` |
| `carousel` | `carousel` | No estaba en la lista original pero está en el código |
| `sponsors` | `sponsors` | |

**No migrar:** `participantes2025`, `counters`, `eventYears`, `routes` (las últimas 3 no existen en el código).

---

## Credenciales Supabase

```
URL:           https://czhrucrrasgwhqpqivfb.supabase.co
Project ID:    czhrucrrasgwhqpqivfb
Anon key:      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...W0WQxp0qMj0HQN3vNsCb2ypSkwyyid8YJqCLf2kQezE
Service role:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...UBQbXHeSLPtKvUhbDxSZaJlAUdf201tSKOiLajoNKTs
```

Se agregarán al `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://czhrucrrasgwhqpqivfb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Fases de ejecución

---

### FASE 1 — Schema SQL (tablas + RLS)

Crear archivo `supabase/schema.sql` con todas las tablas y políticas RLS.

#### Tablas principales:

```sql
-- admins
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  photo_url text,
  role text NOT NULL DEFAULT 'pending',
  login_method text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- participantes (PK = dni)
CREATE TABLE participantes (
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

-- gastos (con campo year para reemplazar gastos2025)
CREATE TABLE gastos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto text,
  monto numeric,
  categoria text,
  descripcion text,
  pagado_por text,
  fecha timestamptz DEFAULT now(),
  year int
);

-- settings (clave-valor, id = nombre del subdocumento)
CREATE TABLE settings (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'
);

-- configuracion (clave-valor)
CREATE TABLE configuracion (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'
);

-- benefits
CREATE TABLE benefits (
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
CREATE TABLE historia (
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

-- jersey (doc único, id siempre 'info')
CREATE TABLE jersey (
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

-- contacto (doc único, id siempre 'info')
CREATE TABLE contacto (
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
CREATE TABLE galeria_fotos (
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
CREATE TABLE remera (
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
CREATE TABLE remera_comprobantes (
  id text PRIMARY KEY,
  comprobante_base64 text
);

-- itinerario (PK = año_dia, ej: '2025_sabado')
CREATE TABLE itinerario (
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
CREATE TABLE carousel (
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
CREATE TABLE sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  website text,
  image_base64 text,
  "order" int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

#### Políticas RLS:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
-- ... (todas las demás)

-- Datos públicos de solo lectura (anon puede leer)
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

-- Escritura y lectura de datos sensibles: solo autenticados
-- Se usa service_role key en server-side para bypass completo de RLS
```

**Estrategia RLS simplificada:** Las escrituras admin usarán el `service_role` key via una capa de API routes (`/api/*`) en Next.js. Las lecturas públicas usan la `anon` key directamente.

---

### FASE 2 — Cliente Supabase

Crear dos archivos:

**`lib/supabase/client.ts`** — cliente browser (anon key):
```ts
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**`lib/supabase/admin.ts`** — cliente server (service role, solo en API routes):
```ts
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

### FASE 3 — Migración de Auth

Firebase Auth → Supabase Auth.

**Cambios en flujo de login admin:**
1. `signInWithEmailAndPassword` → `supabase.auth.signInWithPassword({ email, password })`
2. `signInWithPopup` (Google) → `supabase.auth.signInWithOAuth({ provider: 'google' })`
3. `onAuthStateChanged` → `supabase.auth.onAuthStateChange((event, session) => {...})`
4. `signOut` → `supabase.auth.signOut()`
5. Verificación de rol: después del login, query a `admins` table por email

**Archivos afectados:**
- `app/admin/page.tsx` — formulario de login
- `app/admin/layout.tsx` — auth guard + verificación de rol
- `lib/firebase/firebase-provider.tsx` → reemplazar por `lib/supabase/auth-provider.tsx`

---

### FASE 4 — Script de migración de datos

Crear `scripts/migrate-firebase-to-supabase.ts`:

1. Conecta a Firestore con service account (`cicloturismo.json`)
2. Lee cada colección
3. Transforma los datos al schema de Supabase (snake_case, timestamps, etc.)
4. Inserta en Supabase con `supabaseAdmin`

Colecciones migradas en orden:
1. `settings` subdocs → `settings` table
2. `configuracion` subdocs → `configuracion` table
3. `admins` → `admins`
4. `benefits` → `benefits`
5. `historia` → `historia`
6. `jersey/info` → `jersey`
7. `contacto/info` → `contacto`
8. `galeriaFotos` → `galeria_fotos`
9. `remera` → `remera`
10. `remera_comprobantes` → `remera_comprobantes`
11. `itinerario` → `itinerario`
12. `carousel` → `carousel`
13. `sponsors` → `sponsors`
14. `gastos2025` → `gastos` (con `year: 2025`)
15. `participantesCicloTermal` → `participantes`

---

### FASE 5 — Migración de código (capa de datos)

Reemplazar todas las llamadas a Firestore con llamadas a Supabase.

#### Mapeo de operaciones:

| Firebase | Supabase |
|---|---|
| `getDocs(query(collection(db, "X"), where("a", "==", b)))` | `supabase.from("X").select("*").eq("a", b)` |
| `getDoc(doc(db, "X", id))` | `supabase.from("X").select("*").eq("id", id).single()` |
| `addDoc(collection(db, "X"), data)` | `supabase.from("X").insert(data).select().single()` |
| `setDoc(doc(db, "X", id), data, {merge: true})` | `supabase.from("X").upsert({id, ...data})` |
| `updateDoc(doc(db, "X", id), data)` | `supabase.from("X").update(data).eq("id", id)` |
| `deleteDoc(doc(db, "X", id))` | `supabase.from("X").delete().eq("id", id)` |
| `writeBatch().update(...)` | Múltiples `.update()` en paralelo con `Promise.all` |
| `orderBy("order", "asc")` | `.order("order", { ascending: true })` |
| `where("años", "array-contains", year)` | `.contains("años", [year])` |

#### Archivos a modificar (en orden de dependencia):

**Infraestructura (primero):**
1. `lib/firebase/firebase-config.ts` → sustituido por `lib/supabase/client.ts`
2. `lib/firebase/firebase-provider.tsx` → reescribir como `lib/supabase/auth-provider.tsx`
3. `lib/admin-data-context.tsx` — reemplazar llamadas Firestore
4. `lib/use-cached-firestore.ts` → reescribir como `lib/use-cached-supabase.ts`

**Páginas admin:**
5. `app/admin/page.tsx` — login
6. `app/admin/layout.tsx` — auth guard
7. `app/admin/settings/page.tsx`
8. `app/admin/gastos/page.tsx`
9. `app/admin/registrations/page.tsx`
10. `app/admin/remera/page.tsx`
11. `app/admin/content/page.tsx`

**Componentes admin:**
12. `components/admin/benefits-editor.tsx`
13. `components/admin/carousel-editor.tsx`
14. `components/admin/contact-editor.tsx`
15. `components/admin/history-editor.tsx`
16. `components/admin/itinerary-editor.tsx`
17. `components/admin/jersey-editor.tsx`
18. `components/admin/photos-editor.tsx`
19. `components/admin/sponsors-editor.tsx`

**Páginas públicas:**
20. `app/inscripcion/[año]/page.tsx`
21. `app/inscripcion/confirmacion/page.tsx`
22. `app/fotos/page.tsx`
23. `app/pedir-remera/page.tsx`

**Componentes públicos:**
24. `components/benefits-section.tsx`
25. `components/history-section.tsx`
26. `components/jersey-section.tsx`
27. `components/sponsors-section.tsx`

---

### FASE 6 — Limpieza

1. Desinstalar paquetes Firebase: `firebase`, `firebase-admin`
2. Eliminar `lib/firebase/` (conservar como backup hasta confirmar funcionamiento)
3. Remover variables de entorno Firebase del `.env.local`
4. Remover imports de firebase de `next.config.mjs`

---

## Dependencias a instalar

```bash
npm install @supabase/supabase-js @supabase/ssr
```

Para el script de migración (dev only):
```bash
npm install --save-dev firebase-admin
```

---

## Variables de entorno finales

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://czhrucrrasgwhqpqivfb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6aHJ1Y3JyYXNnd2hxcHFpdmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NzIzNTksImV4cCI6MjA5NTA0ODM1OX0.W0WQxp0qMj0HQN3vNsCb2ypSkwyyid8YJqCLf2kQezE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6aHJ1Y3JyYXNnd2hxcHFpdmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MjM1OSwiZXhwIjoyMDk1MDQ4MzU5fQ.UBQbXHeSLPtKvUhbDxSZaJlAUdf201tSKOiLajoNKTs

# Google Drive (sin cambios)
GOOGLE_DRIVE_FOLDER_ID=...
GOOGLE_SERVICE_ACCOUNT_KEY=...

# Firebase (solo para script de migración, remover después)
# NEXT_PUBLIC_FIREBASE_API_KEY=...
```

---

## Riesgos y consideraciones

| Riesgo | Mitigación |
|---|---|
| Pérdida de datos durante migración | Script de migración es idempotente (upsert), no destructivo |
| Auth: usuarios admin deben volver a crear contraseña | Enviar reset por email post-migración, o migrar hashes manualmente |
| Google OAuth en Supabase debe configurarse en el dashboard | Configurar antes de ejecutar Fase 3 |
| `años` es array en Firestore → `int[]` en PostgreSQL | `.contains("años", [year])` en Supabase |
| Imágenes en base64 en Firestore → quedan en Supabase | Sin cambio en este plan (no es responsabilidad de la migración) |
| `writeBatch` de Firebase no tiene equivalente directo | Reemplazar con `Promise.all` de updates individuales |

---

## Orden de ejecución resumido

```
1. Crear schema SQL + correr en Supabase dashboard
2. Instalar @supabase/supabase-js + @supabase/ssr
3. Crear lib/supabase/client.ts y lib/supabase/admin.ts
4. Correr script de migración de datos (Firestore → Supabase)
5. Migrar Auth (firebase-provider → auth-provider)
6. Migrar admin-data-context + use-cached-firestore
7. Migrar páginas admin (settings, gastos, registrations, remera)
8. Migrar componentes admin (editors)
9. Migrar páginas públicas (inscripcion, fotos, pedir-remera)
10. Migrar componentes públicos (sections)
11. Testear build completo
12. Limpiar Firebase
13. Deploy
```

---

## Estado

- [x] Fase 1 — Schema SQL
- [x] Fase 2 — Cliente Supabase
- [x] Fase 3 — Auth
- [x] Fase 4 — Script migración de datos
- [ ] Fase 5 — Código (capa de datos)
- [ ] Fase 6 — Limpieza
