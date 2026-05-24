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
- Leer solo los archivos estrictamente necesarios para la tarea. No explorar el proyecto si no hace falta.
- No correr `npm run build` si el cambio no toca TypeScript ni imports.
- No correr lint salvo que se lo pida explícitamente.

## Git

- Commitear con mensajes descriptivos en español, en imperativo. Ej: "Agrega validación de stock".
- Un solo commit al final de todos los cambios pedidos en un mensaje. No hacer commits intermedios.
- Pushear sin pedir confirmación una vez que los tests pasen.

## Project Overview

**Cicloturismo Termal de Federación** — App Next.js 15 para gestionar un evento de cicloturismo en Federación, Entre Ríos. Deploy en https://ciclo-turismo.vercel.app.

## Commands

```bash
npm run dev      # Dev server (http://localhost:3000)
npm run build    # Build de producción
npm start        # Servidor de producción
npm run lint     # ESLint
```

No hay test runner configurado. ESLint y TypeScript están deshabilitados en build (`next.config.mjs`).

## Architecture

**Framework:** Next.js 15 App Router, TypeScript, React 19  
**Styling:** Tailwind CSS + Shadcn/ui (Radix primitives, neutral base, CSS variables)  
**Database/Auth:** Firebase Firestore + Firebase Authentication  
**Libs principales:** React Hook Form + Zod (forms), Leaflet (maps), EmailJS (email), Recharts (charts), Framer Motion (animations), Google Drive API (uploads)

### App Router structure

```
app/
  page.tsx                    # Home pública (hero carousel + secciones)
  layout.tsx                  # Root layout → ClientProviders
  admin/
    page.tsx                  # Login admin
    layout.tsx                # Auth guard + AdminDataProvider + sidebar
    dashboard/page.tsx        # Estadísticas (~2200 líneas)
    registrations/page.tsx    # Gestión de inscriptos (~2200 líneas)
    gastos/page.tsx           # Gastos
    content/page.tsx          # Editor de contenido del evento
    settings/page.tsx         # Configuración
    remera/page.tsx           # Gestión de remeras
  inscripcion/
    page.tsx                  # Formulario de inscripción (RHF + Zod)
    [año]/page.tsx            # Inscripción por año
    confirmacion/page.tsx
  pedir-remera/page.tsx       # Pedido público de remera
  fotos/page.tsx              # Galería de fotos
  api/
    upload-drive/route.js     # Upload a Google Drive (único API route)
```

### Provider chain

`layout.tsx` → `ClientProviders` → `ThemeProvider` → `FirebaseProvider`

- `ClientProviders` (`components/client-providers.tsx`) carga `FirebaseProvider` con `dynamic(..., { ssr: false })` para evitar errores de prerender.
- `FirebaseProvider` (`lib/firebase/firebase-provider.tsx`) expone auth state, event settings y `ciclosConfig` via context. Si Firebase no está disponible, usa defaults hardcodeados.
- `AdminDataProvider` (`lib/admin-data-context.tsx`) wrappea solo `/admin/*` (excepto login). Cachea registrations y expenses con localStorage + memory cache (30 min TTL).

### Caching

- `lib/use-cached-firestore.ts` — Hook genérico con cache en memoria + localStorage (1h TTL) para datos públicos.
- `lib/admin-data-context.tsx` — Cache de registrations/expenses solo en admin (30 min TTL).

### Roles admin

El layout de admin consulta `admins` collection en Firestore por email. El rol `"remera"` redirige forzosamente a `/admin/remera`.

### Secciones de la home

La home (`app/page.tsx`) compone secciones desde `components/*-section.tsx`. Para agregar una sección: crear componente en `components/`, importar en `app/page.tsx`.

### Componentes admin

Los editores de contenido están en `components/admin/` (carousel-editor, contact-editor, form-editor, etc.). Cada editor gestiona su propia lectura/escritura a Firestore.

### Convenciones

- `@/*` mapea a la raíz del repo. Usar siempre imports con `@/`, nunca relativos.
- `components/ui/` — Shadcn/ui, no editar manualmente.
- Páginas admin acceden Firestore directamente, no hay API layer intermedio.
- `next.config.mjs` optimiza imports de lucide-react, framer-motion, recharts, radix y firebase.

## Environment

`.env.local` tiene credenciales de Firebase y Google API keys. Necesario para desarrollo local.
