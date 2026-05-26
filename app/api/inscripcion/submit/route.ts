import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const BUCKET = "comprobantes"

async function subirComprobante(
  dni: string,
  imagenBase64: string,
  nombreArchivo: string,
): Promise<string | null> {
  try {
    // Asegurar que el bucket exista
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const existe = buckets?.some((b) => b.name === BUCKET)
    if (!existe) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
    }

    // Decodificar base64 → Buffer
    const base64Data = imagenBase64.replace(/^data:.+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    const ext = nombreArchivo.split(".").pop() ?? "jpg"
    const contentType = ext === "pdf" ? "application/pdf" : `image/${ext}`
    const path = `${dni}/${Date.now()}.${ext}`

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true })

    if (error) {
      console.error("[subirComprobante] upload error:", error.message)
      return null
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.error("[subirComprobante] catch:", err)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dni, añoParam, perfilPersonal, datosCiclo, grupoIngresado, gruposExistentes, nombreArchivo } = body

    // Subir comprobante a Storage si viene con la inscripción
    let comprobantePagoUrl: string | null = null
    if (perfilPersonal.imagenBase64 && nombreArchivo) {
      comprobantePagoUrl = await subirComprobante(dni, perfilPersonal.imagenBase64, nombreArchivo)
    }

    // Leer años actuales
    const { data: existingPart } = await supabaseAdmin
      .from("participantes")
      .select("años")
      .eq("dni", dni)
      .maybeSingle()
    const currentAños: number[] = existingPart?.años ?? []
    const newAños = [...new Set([...currentAños, añoParam])]

    // Obtener próximo número de inscripción
    const { data: rows } = await supabaseAdmin
      .from("participantes")
      .select("dni")
      .contains("años", [añoParam])
    const numeroInscripcion = (rows?.length ?? 0) + 1

    const { error } = await supabaseAdmin.from("participantes").upsert({
      dni,
      nombre: perfilPersonal.nombre,
      apellido: perfilPersonal.apellido,
      email: perfilPersonal.email || "",
      telefono: perfilPersonal.telefono || "",
      pais_telefono: perfilPersonal.paisTelefono || "Argentina",
      telefono_emergencia: perfilPersonal.telefonoEmergencia || "",
      pais_telefono_emergencia: perfilPersonal.paisTelefonoEmergencia || "Argentina",
      fecha_nacimiento: perfilPersonal.fechaNacimiento || "",
      localidad: perfilPersonal.localidad || "",
      grupo_sanguineo: perfilPersonal.grupoSanguineo || "",
      genero: perfilPersonal.genero || "",
      grupo_ciclistas: perfilPersonal.grupoCiclistas || "",
      talle_remera: datosCiclo.talleRemera || "",
      condiciones_salud: perfilPersonal.condicionSalud ?? null,
      es_celiaco: null,
      nombre_transferencia: datosCiclo.nombreTransferencia || "",
      precio: "",
      estado: "pendiente",
      comprobante_pago_url: comprobantePagoUrl,
      acepta_condiciones: datosCiclo.aceptaTerminos ?? false,
      fecha_inscripcion: new Date().toISOString(),
      numero_inscripcion: numeroInscripcion,
      años: newAños,
    })

    if (error) {
      console.error("[inscripcion/submit] upsert error:", JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Guardar grupo nuevo si corresponde
    if (grupoIngresado && grupoIngresado !== "No pertenezco a ninguno") {
      const existentes: string[] = gruposExistentes ?? []
      if (!existentes.some((g: string) => g.toLowerCase() === grupoIngresado.toLowerCase())) {
        const { data: currentConfig } = await supabaseAdmin
          .from("configuracion")
          .select("data")
          .eq("id", "grupos")
          .maybeSingle()
        const listaActual: string[] = currentConfig?.data?.lista ?? []
        if (!listaActual.some((g: string) => g.toLowerCase() === grupoIngresado.toLowerCase())) {
          await supabaseAdmin
            .from("configuracion")
            .upsert({ id: "grupos", data: { lista: [...listaActual, grupoIngresado] } })
        }
      }
    }

    return NextResponse.json({ ok: true, numeroInscripcion })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno"
    console.error("[inscripcion/submit] catch:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
