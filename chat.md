 Plan: de más a menos crítico

  ---
  P0 — Seguridad (hacer hoy)
  
  1. /api/upload sin autenticación
  Cualquier persona en internet puede hacer POST a https://ciclo-turismo.vercel.app/api/upload y subir archivos.
   Sin token, sin sesión, sin nada.

  2. Path traversal en /api/upload
  El parámetro folder llega directo a path.join(uploadDir, fileName). Un valor como folder=../../etc puede
  escribir fuera de public/. Hay que validar que folder solo contenga caracteres seguros.

  3. /api/upload no funciona en Vercel
  Escribe en process.cwd()/public/ — en Vercel el filesystem es read-only en producción. La ruta de subida local
   está rota silenciosamente en prod. Solo funciona /api/upload-drive.

  4. EmailJS keys hardcodeadas en código fuente
  registrations/page.tsx:61 y [año]/page.tsx:52 tienen las keys expuestas. Deberían ser NEXT_PUBLIC_EMAILJS_KEY
  en .env.local.

  ---
  P1 — Rendimiento (impacto directo en velocidad)

  5. Dashboard y Registrations son monolitos de 2200+ líneas
  Ambos descargan su bundle completo, tienen 20+ useState en un componente, y cualquier cambio de estado
  re-renderiza todo. Hay que partirlos en componentes con memo.

  6. getDocs sin límite trae todos los registros
  dashboard/page.tsx:280 y registrations/page.tsx:190 hacen getDocs sin paginación. Con 300+ participantes (y
  creciendo cada año) esto descarga todo cada vez. Firestore cobra por lectura por documento.

  7. dynamic() sin loading prop
  Los 6 dynamic() en page.tsx muestran nada mientras cargan. Hay que pasar { loading: () => <Skeleton /> } o al
  menos { ssr: false } donde corresponde.

  8. Cálculos pesados fuera de useMemo
  En dashboard/page.tsx los stats (conteo de talles, grupos, celíacos, días) se calculan dentro de
  fetchRegistrations y re-calculan con cada filtro. Deberían ser useMemo derivados de los datos base.

  ---
  P2 — Deuda técnica (hace lento el desarrollo)

  9. parseHealthConditions duplicada
  Misma función, idéntica, en dashboard/page.tsx:160 y registrations/page.tsx:81. Pertenece a lib/utils.ts.

  10. cycling-map.tsx entero comentado
  Todo el componente está envuelto en {/* */} desde la línea 1. Si está en desuso, borrar. Si no, descommentar.

  11. firebase-admin en package.json sin uso aparente
  firebase-admin es 15MB y no hay ningún uso en rutas API. Si no se usa, afuera.

  ---
  P3 — Mejoras menores

  12. app/inscripcion/page.tsx hace un getDoc extra
  Ya FirebaseProvider carga ciclosConfig. La página de redirect lo vuelve a cargar independientemente. Se puede
  usar el contexto.

  13. next.config.mjs no incluye firebase en optimizePackageImports
  Firebase es uno de los bundles más grandes. Hay que agregarlo.

  ---
  Resumen de impacto

  ┌───────┬─────────────────────────────┬──────────┬───────────┐
  │   #   │           Impacto           │ Esfuerzo │ Prioridad │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 1-2   │ Seguridad crítica           │ Bajo     │ P0        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 3     │ Bug silencioso en prod      │ Bajo     │ P0        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 4     │ Seguridad media             │ Bajo     │ P0        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 5     │ Velocidad admin enorme      │ Alto     │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 6     │ Costo Firestore + velocidad │ Medio    │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 7     │ UX home page                │ Bajo     │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 7     │ UX home page                │ Bajo     │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 8     │ Re-renders admin            │ Medio    │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 9     │ Mantenibilidad              │ Bajo     │ P2        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 10-11 │ Limpieza                    │ Bajo     │ P2        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 5     │ Velocidad admin enorme      │ Alto     │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 6     │ Costo Firestore + velocidad │ Medio    │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 7     │ UX home page                │ Bajo     │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  12. app/inscripcion/page.tsx hace un getDoc extra
  Ya FirebaseProvider carga ciclosConfig. La página de redirect lo vuelve a cargar independientemente. Se puede
  usar el contexto.

  13. next.config.mjs no incluye firebase en optimizePackageImports
  Firebase es uno de los bundles más grandes. Hay que agregarlo.

  ---
  Resumen de impacto

  ┌───────┬─────────────────────────────┬──────────┬───────────┐
  │   #   │           Impacto           │ Esfuerzo │ Prioridad │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 1-2   │ Seguridad crítica           │ Bajo     │ P0        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 3     │ Bug silencioso en prod      │ Bajo     │ P0        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 4     │ Seguridad media             │ Bajo     │ P0        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 5     │ Velocidad admin enorme      │ Alto     │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 6     │ Costo Firestore + velocidad │ Medio    │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 7     │ UX home page                │ Bajo     │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 8     │ Re-renders admin            │ Medio    │ P1        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 9     │ Mantenibilidad              │ Bajo     │ P2        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 10-11 │ Limpieza                    │ Bajo     │ P2        │
  ├───────┼─────────────────────────────┼──────────┼───────────┤
  │ 12-13 │ Optimización menor          │ Bajo     │ P3        │
  └───────┴─────────────────────────────┴──────────┴───────────┘
