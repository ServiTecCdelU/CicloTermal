Migrar colección `participantes_2025` → `participantesCicloTermal`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ESTRUCTURA DEL DOCUMENTO (ID = DNI)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  // Perfil personal (se actualiza si cambia)
  nombre, apellido, email, telefono, paisTelefono,
  telefonoEmergencia, paisTelefonoEmergencia,
  dni, fechaNacimiento, genero,
  grupoSanguineo, condicionSalud,
  localidad, grupoCiclistas,
  imagenBase64, nombreArchivo,

  // Datos del ciclo vigente (se pisan cada año)
  talleRemera,
  precio: "",              // siempre vacío al inscribirse
  estado: "pendiente",     // siempre pendiente al inscribirse
  comprobantePagoUrl,
  transferidoA: "",        // siempre vacío al inscribirse
  numeroInscripcion,
  aceptaTerminos,
  fechaInscripcion,
  fechaActualizacion,

  // Historial de participación
  años: [2025]             // se agrega el año cada vez que se inscribe
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIGURACIÓN DE INSCRIPCIONES (Firestore)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Colección `configuracion`, documento `inscripciones`:

{
  ciclos: [
    {
      año: 2026,
      habilitado: true,
      fechaDesde: "2026-03-01",   // seleccionable desde settings
      fechaHasta: "2026-09-30"    // seleccionable desde settings
    },
    {
      año: 2027,
      habilitado: false,
      fechaDesde: "",
      fechaHasta: ""
    }
  ]
}

esto tiene que ser editable en  /admin/settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RUTAS DE INSCRIPCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- La ruta es dinámica: /inscripcion/[año] → app/inscripcion/[año]/page.tsx
- Ejemplos válidos: /inscripcion/2026, /inscripcion/2027
- Si el año no existe en `ciclos` o tiene habilitado: false → mostrar página "inscripción no disponible"
- Si habilitado: true pero fuera de fechaDesde/fechaHasta → mostrar "inscripción cerrada"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PANEL DE SETTINGS (admin/settings)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Por cada ciclo en `configuracion/inscripciones`:
- Botón "Habilitar / Deshabilitar inscripción XXXX"
- Selector de fechaDesde y fechaHasta
- Botón "Agregar nuevo año" (agrega entrada con habilitado: false)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TAREAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MIGRACIÓN (la hace el usuario manualmente)
   - Copiar documentos de `participantes_2025` → `participantesCicloTermal`
   - ID de cada doc = DNI del participante
   - Agregar campo `años: [2025]` a cada uno
   - Eliminar campo `year`
   (ya esta)

2. FORMULARIO DE INSCRIPCIÓN
   - Mover app/inscripcion/page.tsx → app/inscripcion/[año]/page.tsx
   - Al ingresar DNI, buscar en `participantesCicloTermal`
     · Si existe: precargar perfil personal, no tocar campo `años` aún
     · Si no existe: formulario vacío
   - Al confirmar inscripción:
     · Pisar datos del ciclo vigente (precio: "", estado: "pendiente", transferidoA: "")
     · Agregar año al array `años` si no está ya
     · Guardar/actualizar documento

3. ADMIN
   - Actualizar todas las referencias de `participantes_2025` → `participantesCicloTermal`
   - El filtro por año en listados usa: where("años", "array-contains", 2026)
   - Eliminar cualquier uso del campo `year`

4. SETTINGS ✅
   - UI en admin/settings gestiona todos los ciclos: toggle, fechaDesde, fechaHasta, "Agregar año"
   - Lee/escribe en `configuracion/inscripciones`

5. cosas para sacar ✅
  - Eliminada la alerta "sin remera"

6. cosas que no andan ✅
  - DNI es ahora el primer campo (col-span-2, destacado)
  - Fix bug closure: onBlur usa e.target.value para el lookup (no formData stale)

7. optimiza completamente la inscripcion...
  - mas rapida
  - que ande en todos los dispositivos
  - optimizalo

8. fijate y analiza si crees que falta o hay que editar algo mas
