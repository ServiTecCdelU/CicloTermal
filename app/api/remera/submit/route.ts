import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dni, nombre, telefono, items, tiene_comprobante, esta_registrado, envio_tipo, direccion, isEditing, comprobanteBase64 } = body

    const upsertData: Record<string, unknown> = {
      dni,
      nombre,
      telefono,
      items,
      tiene_comprobante: tiene_comprobante || !!comprobanteBase64,
      esta_registrado,
      envio_tipo,
      direccion: envio_tipo === "envio" ? direccion : null,
    }
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

    if (comprobanteBase64 && remeraRow?.id) {
      await supabaseAdmin.from("remera_comprobantes").upsert({
        id: remeraRow.id,
        comprobante_base64: comprobanteBase64,
      })
    }

    return NextResponse.json({ id: remeraRow.id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
