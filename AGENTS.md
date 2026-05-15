Reglas mínimas y señales que un agente suele pasar por alto (español).

- Lenguaje: todas las interacciones y commits en español.
- Respuestas concisas: evitar introducciones, cierres y florituras.

- Comandos exactos:
  - `npm run dev` — inicia dev server (http://localhost:3000).
  - `npm run build` — build de producción (NEXT/TS checks están deshabilitados en build).
  - `npm start` — arranca el servidor de producción.
  - `npm run lint` — ejecuta ESLint manualmente.

- Importantísimo: `next.config.mjs` tiene
  - `eslint.ignoreDuringBuilds = true` y `typescript.ignoreBuildErrors = true`.
  - No confíes en `npm run build` para encontrar errores de ESLint/TS.

- Variables de entorno y secretos:
  - `.env.local` es la convención; no commitear secretos.
  - Este repo incluye un `.env` con valores ejemplo/production — revisa antes de tocar.
  - Google Drive y Firebase Admin requieren variables (GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL). `GOOGLE_PRIVATE_KEY` contiene saltos de línea codificados y se usa con `.replace(/\\n/g, "\n")`.

- Google Drive / uploads:
  - `lib/google-drive.js` tiene un `GOOGLE_DRIVE_FOLDER_ID` hardcodeado.
  - `uploadToGoogleDrive` exige `GOOGLE_CLIENT_EMAIL` y `GOOGLE_PRIVATE_KEY` o falla.
  - Archivos subidos se hacen públicos; la URL pública se construye como `https://drive.google.com/uc?id=<fileId>`.

- API y seguridad:
  - `app/api/upload-drive/route.js` exige header `Authorization: Bearer <idToken>` y valida con `adminAuth.verifyIdToken`.
  - El endpoint valida tipo MIME `image/*`, tamaño máximo 5MB.

- Arquitectura relevante:
  - Next.js 15 App Router. Entradas principales en `app/`.
  - `lib/firebase/*` contiene inicialización cliente y admin.
  - `components/ui/` contiene componentes de Shadcn/ui: no editarlos masivamente sin motivo.
  - `@/*` está mapeado a la raíz (`tsconfig.json`), usar alias `@/` en imports.

- Tests y CI:
  - No hay runner de tests configurado; no esperes `npm test`.
  - Si añades tests, documenta cómo ejecutarlos localmente.

- Edición y commits:
  - Preferir cambios quirúrgicos (una función, un archivo) sobre reescrituras.
  - Mensajes de commit en español, imperativo. Un commit por cambio lógico.
  - No empujar forzosamente ni usar --amend salvo que te lo pidan.

- Deuda técnica y heurísticas rápidas:
  - Evitar introducir nuevas dependencias sin necesidad. Revisa `package.json` antes.
  - `next.config.mjs` optimiza imports de paquetes listados; tocar con cuidado.

- Qué buscar primero al llegar al repo:
  1. `package.json` (scripts, deps).
 2. `next.config.mjs` (build/ts/eslint quirks).
 3. `.env` / `.env.local` (credenciales necesarias).
 4. `lib/firebase` y `lib/google-drive.js` (integraciones externas que requieren credenciales).

Asumí: seguir las convenciones de CLAUDE.md ya presentes en el repo.
