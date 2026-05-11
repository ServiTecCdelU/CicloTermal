# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comportamiento general

- Responder siempre en español, sin excepción.
- Sin introducción, sin cierre, sin explicar lo que se va a hacer. Solo el resultado.
- Sin frases de cortesía ("¡Claro!", "Por supuesto", "Entendido"). Ir directo al punto.
- Sin resúmenes al final del tipo "Listo, hice X, Y y Z". Si está hecho, está hecho.
- Respuestas mínimas. Frases cortas. Sin sinónimos decorativos. Sin repetir lo que dijo el usuario.
- Usar la menor cantidad de tokens posible.
- Si se hicieron suposiciones, listarlas en una sola línea al final: "Asumí: X, Y".
- Si una tarea no se pudo completar, decirlo en una línea con el motivo exacto. Sin disculpas.
- Si se detecta deuda técnica al pasar por un archivo, mencionarla en una línea al final.
- Nada de markdown decorativo en respuestas de consola o logs. Solo texto plano cuando corresponda.

## Confirmaciones y preguntas

- NUNCA pedir confirmación al usuario. Ejecutar, commitear y pushear sin esperar respuesta.
- Ante ambigüedad menor, asumir e informar al final (una línea, sin drama).
- Solo hacer una pregunta si sin la respuesta es imposible continuar. Una sola. Al inicio.
- No pedir confirmación para testear, ejecutar directamente.
- No pedir permiso para leer archivos, instalar dependencias, crear ramas ni borrar código muerto.

## Ejecución y código

- Testear el código antes de declarar una tarea terminada. Si falla, corregir y volver a testear.
- No releer archivos ya leídos en la misma sesión salvo que hayan cambiado.
- Preferir edición quirúrgica sobre reescrituras completas. Cambiar solo lo necesario.
- Si hay un error, diagnosticar antes de parchear. No agregar código defensivo sin entender la causa.
- No duplicar lógica existente. Buscar si ya existe antes de crear algo nuevo.
- Respetar el stack y convenciones del proyecto. No introducir nuevas librerías sin necesidad real.
- Inferir el contexto del proyecto desde el código. No asumir nada sobre el negocio sin leer primero.
- No romper funcionalidad existente al agregar features. Correr los tests relacionados siempre.

## Git

- Commitear con mensajes descriptivos en español, en imperativo. Ej: "Agrega validación de stock".
- Un commit por cambio lógico. No acumular todo en un solo commit gigante.
- Pushear sin pedir confirmación una vez que los tests pasen.

## Project Overview

**Cicloturismo Termal de Federación** — A Next.js 15 web app for managing a cycling tourism event in Federación, Entre Ríos, Argentina. Deployed at https://ciclo-turismo.vercel.app.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

No test runner is configured. ESLint and TypeScript checks are disabled during `build` in `next.config.mjs`.

## Architecture

**Framework:** Next.js 15 App Router, TypeScript, React 19  
**Styling:** Tailwind CSS + Shadcn/ui (Radix primitives, neutral base, CSS variables)  
**Database/Auth:** Firebase Firestore + Firebase Authentication  
**Key libs:** React Hook Form + Zod (forms), Leaflet (maps), EmailJS (email), Recharts (charts), Framer Motion (animations), Google Drive API (file uploads)

### App Router structure

```
app/
  page.tsx              # Public home page (hero carousel + sections)
  layout.tsx            # Root layout — wraps ThemeProvider + FirebaseProvider
  admin/                # Protected admin area (requires Firebase auth)
    dashboard/page.tsx  # Statistics & metrics (~2200 lines)
    registrations/page.tsx # Participant management (~2200 lines)
    gastos/page.tsx     # Expense tracking
    content/page.tsx    # Event content editor
    settings/page.tsx   # Configuration
  inscripcion/
    page.tsx            # Registration form (React Hook Form + Zod)
    confirmacion/page.tsx
  fotos/page.tsx        # Photo gallery
  api/
    upload/route.js         # File upload
    upload-drive/route.js   # Google Drive integration
```

### Key components

- `components/navbar.tsx` / `footer.tsx` — Site chrome
- `components/ui/` — 40+ Shadcn/ui components (do not edit manually)
- `lib/firebase/firebase-config.ts` — Firebase app initialization
- `lib/firebase/firebase-provider.tsx` — Auth context + event settings (React context)
- `lib/google-drive.js` — Google Drive API wrapper

### Data flow

- **Firebase Auth** gates the entire `/admin` subtree
- **Firestore** is the primary data store for registrations, expenses, settings, and event content
- The `FirebaseProvider` (`lib/firebase/firebase-provider.tsx`) exposes auth state and event settings to all components via context
- Admin pages read/write Firestore directly using the Firebase SDK (no custom API layer)

### Adding home page sections

The home `page.tsx` composes section components from `components/`. Add a new section component there and import it into `app/page.tsx`.

### Path aliases

`@/*` maps to the repo root (configured in `tsconfig.json`). Always use `@/` imports, not relative paths.

## Environment

`.env.local` holds Firebase credentials and Google API keys — required for local development. Copy from a team member; never commit secrets.
