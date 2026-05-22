/**
 * migrate-to-supabase.js
 * Lee todas las colecciones de Firestore e inserta en Supabase.
 * Es idempotente: usa upsert donde hay PK de texto, insert limpio donde la PK es uuid.
 *
 * Uso: node scripts/migrate-to-supabase.js
 */

const admin = require("firebase-admin")
const { createClient } = require("@supabase/supabase-js")
const path = require("path")

// ── Credenciales ──────────────────────────────────────────────────────────────
const serviceAccount = require(path.join(__dirname, "../cicloturismo.json"))

const SUPABASE_URL = "https://czhrucrrasgwhqpqivfb.supabase.co"
const SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6aHJ1Y3JyYXNnd2hxcHFpdmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ3MjM1OSwiZXhwIjoyMDk1MDQ4MzU5fQ.UBQbXHeSLPtKvUhbDxSZaJlAUdf201tSKOiLajoNKTs"

// ── Clientes ──────────────────────────────────────────────────────────────────
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const firestore = admin.firestore()
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

// ── Helpers ───────────────────────────────────────────────────────────────────
function toISO(val) {
  if (!val) return null
  if (typeof val === "string") return val
  if (val._seconds !== undefined) return new Date(val._seconds * 1000).toISOString()
  if (typeof val.toDate === "function") return val.toDate().toISOString()
  if (val instanceof Date) return val.toISOString()
  return null
}

function log(msg) { process.stdout.write(msg + "\n") }
function ok(n)    { process.stdout.write(`  ✓ ${n} registros\n`) }
function err(e)   { process.stdout.write(`  ✗ ${e}\n`) }

async function getCollection(name) {
  const snap = await firestore.collection(name).get()
  return snap.docs
}

async function getDoc(col, docId) {
  const snap = await firestore.collection(col).doc(docId).get()
  return snap.exists ? snap.data() : null
}

async function upsert(table, rows, onConflict = "id") {
  if (!rows.length) { log(`  (vacío)`); return }
  const { error } = await supabase.from(table).upsert(rows, { onConflict })
  if (error) throw error
  ok(rows.length)
}

async function insert(table, rows) {
  if (!rows.length) { log(`  (vacío)`); return }
  // Limpiar tabla antes de insertar para evitar duplicados en re-ejecuciones
  await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
  const { error } = await supabase.from(table).insert(rows)
  if (error) throw error
  ok(rows.length)
}

// ── Migraciones ───────────────────────────────────────────────────────────────

async function migrateSettings() {
  log("\n→ settings")
  const docs = await getCollection("settings")
  const rows = docs.map(d => ({ id: d.id, data: d.data() }))
  await upsert("settings", rows)
}

async function migrateConfiguracion() {
  log("\n→ configuracion")
  const docs = await getCollection("configuracion")
  const rows = docs.map(d => ({ id: d.id, data: d.data() }))
  await upsert("configuracion", rows)
}

async function migrateAdmins() {
  log("\n→ admins")
  const docs = await getCollection("admins")

  // Deduplicar por email: quedarse con el doc más reciente (mayor lastLogin)
  const byEmail = new Map()
  for (const d of docs) {
    const data = d.data()
    const email = data.email?.trim()
    if (!email) continue
    const existing = byEmail.get(email)
    const thisLogin = toISO(data.lastLogin) ?? ""
    const prevLogin = existing ? (toISO(existing.lastLogin) ?? "") : ""
    if (!existing || thisLogin > prevLogin) {
      byEmail.set(email, data)
    }
  }

  const rows = Array.from(byEmail.entries()).map(([email, data]) => ({
    email,
    display_name: data.displayName ?? "",
    photo_url: data.photoURL ?? "",
    role: data.role ?? "pending",
    login_method: data.loginMethod ?? "email",
    created_at: toISO(data.createdAt) ?? new Date().toISOString(),
    last_login: toISO(data.lastLogin),
  }))

  await upsert("admins", rows, "email")
}

async function migrateBenefits() {
  log("\n→ benefits")
  const docs = await getCollection("benefits")
  const rows = docs.map(d => {
    const data = d.data()
    return {
      type: data.type ?? "benefit",
      year: data.year ?? null,
      order: data.order ?? 0,
      label: data.label ?? null,
      value: data.value ?? null,
      icon_name: data.iconName ?? null,
      icon_type: data.iconType ?? null,
      text: data.text ?? null,
      created_at: toISO(data.createdAt) ?? new Date().toISOString(),
      updated_at: toISO(data.updatedAt) ?? new Date().toISOString(),
    }
  })
  await insert("benefits", rows)
}

async function migrateHistoria() {
  log("\n→ historia")
  const docs = await getCollection("historia")
  const rows = docs.map(d => {
    const data = d.data()
    return {
      title: data.title ?? "",
      description: data.description ?? "",
      image_url: data.imageUrl ?? null,
      logo_url: data.logoUrl ?? null,
      contact_link: data.contactLink ?? null,
      order: data.order ?? 0,
      year: data.year ?? null,
      created_at: toISO(data.createdAt) ?? new Date().toISOString(),
    }
  })
  await insert("historia", rows)
}

async function migrateJersey() {
  log("\n→ jersey")
  const data = await getDoc("jersey", "info")
  if (!data) { log("  (vacío)"); return }
  const row = {
    id: "info",
    title: data.title ?? "",
    description: data.description ?? "",
    image_url: data.imageUrl ?? null,
    show_section: data.showSection ?? true,
    year: data.year ?? null,
    call_to_action_title: data.callToActionTitle ?? null,
    call_to_action_description: data.callToActionDescription ?? null,
    features: data.features ?? [],
  }
  await upsert("jersey", [row])
}

async function migrateContacto() {
  log("\n→ contacto")
  const data = await getDoc("contacto", "info")
  if (!data) { log("  (vacío)"); return }
  const row = {
    id: "info",
    address: data.address ?? "",
    phones: data.phones ?? [],
    email: data.email ?? "",
    links: data.links ?? [],
    map_url: data.mapUrl ?? null,
    show_map: data.showMap ?? true,
    updated_at: toISO(data.updatedAt) ?? new Date().toISOString(),
  }
  await upsert("contacto", [row])
}

async function migrateGaleriaFotos() {
  log("\n→ galeria_fotos")
  const docs = await getCollection("galeriaFotos")
  const rows = docs.map(d => {
    const data = d.data()
    return {
      type: data.type ?? "featured",
      year: data.year ?? null,
      order: data.order ?? 0,
      image_url: data.imageUrl ?? null,
      description: data.description ?? null,
      name: data.name ?? null,
      link: data.link ?? null,
      created_at: toISO(data.createdAt) ?? new Date().toISOString(),
      updated_at: toISO(data.updatedAt) ?? new Date().toISOString(),
    }
  })
  await insert("galeria_fotos", rows)
}

async function migrateRemera() {
  log("\n→ remera + remera_comprobantes")

  const remeraDocs = await getCollection("remera")
  const comprobanteDocs = await getCollection("remera_comprobantes")

  // Mapa firestoreId → comprobante_base64
  const comprobantes = {}
  for (const d of comprobanteDocs) {
    comprobantes[d.id] = d.data().comprobanteBase64 ?? null
  }

  // Limpiar antes de insertar
  await supabase.from("remera_comprobantes").delete().neq("id", "")
  await supabase.from("remera").delete().neq("id", "00000000-0000-0000-0000-000000000000")

  let okCount = 0
  for (const d of remeraDocs) {
    const data = d.data()
    const { data: inserted, error } = await supabase
      .from("remera")
      .insert({
        dni: data.dni ?? null,
        nombre: data.nombre ?? "",
        telefono: data.telefono ?? "",
        items: data.items ?? [],
        talle: data.talle ?? null,
        tiene_comprobante: data.tieneComprobante ?? false,
        esta_registrado: data.estaRegistrado ?? false,
        estado: data.estado ?? "pendiente",
        fecha_solicitud: data.fechaSolicitud ?? null,
      })
      .select("id")
      .single()

    if (error) { err(`remera ${d.id}: ${error.message}`); continue }

    // Migrar comprobante si existe
    if (comprobantes[d.id] && inserted?.id) {
      const { error: ce } = await supabase.from("remera_comprobantes").insert({
        id: inserted.id,
        comprobante_base64: comprobantes[d.id],
      })
      if (ce) err(`comprobante ${d.id}: ${ce.message}`)
    }

    okCount++
  }
  log(`  ✓ ${okCount} remeras, ${comprobanteDocs.length} comprobantes`)
}

async function migrateItinerario() {
  log("\n→ itinerario")
  const docs = await getCollection("itinerario")
  const rows = docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      day: data.day ?? "",
      title: data.title ?? "",
      time: data.time ?? "",
      subtitle: data.subtitle ?? "",
      content: data.content ?? "",
      year: data.year ?? null,
      updated_at: toISO(data.updatedAt) ?? new Date().toISOString(),
    }
  })
  await upsert("itinerario", rows)
}

async function migrateCarousel() {
  log("\n→ carousel")
  const docs = await getCollection("carousel")
  const rows = docs.map(d => {
    const data = d.data()
    return {
      image_url: data.imageUrl ?? null,
      title: data.title ?? "",
      subtitle: data.subtitle ?? "",
      button_text: data.buttonText ?? null,
      button_url: data.buttonUrl ?? null,
      order: data.order ?? 0,
      year: data.year ?? null,
    }
  })
  await insert("carousel", rows)
}

async function migrateSponsors() {
  log("\n→ sponsors")
  const docs = await getCollection("sponsors")
  const rows = docs.map(d => {
    const data = d.data()
    return {
      name: data.name ?? "",
      website: data.website ?? null,
      image_base64: data.imageBase64 ?? null,
      order: data.order ?? 0,
      created_at: toISO(data.createdAt) ?? new Date().toISOString(),
    }
  })
  await insert("sponsors", rows)
}

async function migrateGastos() {
  log("\n→ gastos (desde gastos2025)")
  const docs = await getCollection("gastos2025")
  const rows = docs.map(d => {
    const data = d.data()
    return {
      concepto: data.concepto ?? "",
      monto: data.monto ?? 0,
      categoria: data.categoria ?? "Otros",
      descripcion: data.descripcion ?? "",
      pagado_por: data.pagadoPor ?? null,
      fecha: toISO(data.fecha) ?? new Date().toISOString(),
      year: 2025,
    }
  })
  await insert("gastos", rows)
}

async function migrateParticipantes() {
  log("\n→ participantes")
  const docs = await getCollection("participantesCicloTermal")
  const rows = docs.map(d => {
    const data = d.data()
    return {
      dni: d.id,
      nombre: data.nombre ?? "",
      apellido: data.apellido ?? "",
      email: data.email ?? "",
      telefono: data.telefono ?? "",
      pais_telefono: data.paisTelefono ?? "",
      telefono_emergencia: data.telefonoEmergencia ?? "",
      pais_telefono_emergencia: data.paisTelefonoEmergencia ?? "",
      fecha_nacimiento: data.fechaNacimiento ?? "",
      localidad: data.localidad ?? "",
      grupo_sanguineo: data.grupoSanguineo ?? "",
      genero: data.genero ?? "",
      grupo_ciclistas: data.grupoCiclistas ?? "",
      talle_remera: data.talleRemera ?? "",
      condiciones_salud: data.condicionesSalud ?? data.condicionSalud ?? null,
      es_celiaco: data.esCeliaco ?? null,
      nombre_transferencia: data.nombreTransferencia ?? null,
      precio: data.precio ?? "",
      transfirio_a: data.transfirio_a ?? data.transferidoA ?? null,
      estado: data.estado ?? "",
      años: data.años ?? [],
      fecha_inscripcion: toISO(data.fechaInscripcion) ?? null,
      acepta_condiciones: data.aceptaCondiciones ?? data.aceptaTerminos ?? false,
      comprobante_pago_url: data.comprobantePagoUrl ?? null,
    }
  })
  await upsert("participantes", rows, "dni")
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log("=== MIGRACIÓN FIRESTORE → SUPABASE ===\n")

  try {
    await migrateSettings()
    await migrateConfiguracion()
    await migrateAdmins()
    await migrateBenefits()
    await migrateHistoria()
    await migrateJersey()
    await migrateContacto()
    await migrateGaleriaFotos()
    await migrateRemera()
    await migrateItinerario()
    await migrateCarousel()
    await migrateSponsors()
    await migrateGastos()
    await migrateParticipantes()

    log("\n=== MIGRACIÓN COMPLETA ✓ ===")
  } catch (e) {
    log(`\n=== ERROR FATAL: ${e.message} ===`)
    console.error(e)
    process.exit(1)
  }

  process.exit(0)
}

main()
