import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const BUCKET = "comprobantes"

async function subirComprobante(dni: string, base64: string, nombreArchivo: string): Promise<string | null> {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    if (!buckets?.some((b) => b.name === BUCKET)) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
    }

    const base64Data = base64.replace(/^data:.+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    const ext = nombreArchivo.split(".").pop() ?? "jpg"
    const contentType = ext === "pdf" ? "application/pdf" : `image/${ext}`
    const path = `remera/${dni}/${Date.now()}.${ext}`

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true })

    if (error) { console.error("[remera/submit] upload:", error.message); return null }

    return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  } catch (err) {
    console.error("[remera/submit] subirComprobante:", err)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dni, nombre, telefono, items, esta_registrado, envio_tipo, direccion, isEditing, comprobanteBase64, nombreArchivo } = body

    let comprobanteUrl: string | null = null
    if (comprobanteBase64 && nombreArchivo) {
      comprobanteUrl = await subirComprobante(dni, comprobanteBase64, nombreArchivo)
    }

    const upsertData: Record<string, unknown> = {
      dni,
      nombre,
      telefono,
      items,
      tiene_comprobante: !!comprobanteUrl || body.tiene_comprobante,
      esta_registrado,
      envio_tipo,
      direccion: envio_tipo === "envio" ? direccion : null,
    }
    if (comprobanteUrl) upsertData.comprobante_url = comprobanteUrl
    if (!isEditing) {
      upsertData.estado = "pendiente"
      upsertData.fecha_solicitud = new Date().toISOString()
    }

    const { data: remeraRow, error } = await supabaseAdmin
      .from("remera")
      .upsert(upsertData, { onConflict: "dni" })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: remeraRow.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
