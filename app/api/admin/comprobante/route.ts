import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/supabase/require-admin"

const BUCKET = "comprobantes"

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { dni, imagenBase64, nombreArchivo } = await request.json()
    if (!dni || !imagenBase64 || !nombreArchivo) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 })
    }

    // Asegurar que el bucket exista
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const existe = buckets?.some((b) => b.name === BUCKET)
    if (!existe) {
      await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
    }

    const base64Data = imagenBase64.replace(/^data:.+;base64,/, "")
    const buffer = Buffer.from(base64Data, "base64")
    const ext = nombreArchivo.split(".").pop() ?? "jpg"
    const contentType = ext === "pdf" ? "application/pdf" : `image/${ext}`
    const path = `${dni}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

    // Actualizar comprobante_pago_url en participantes
    await supabaseAdmin
      .from("participantes")
      .update({ comprobante_pago_url: data.publicUrl, fecha_actualizacion: new Date().toISOString() })
      .eq("dni", dni)

    return NextResponse.json({ url: data.publicUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
