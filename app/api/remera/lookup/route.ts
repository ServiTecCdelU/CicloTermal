export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dni = searchParams.get("dni")?.trim()

  if (!dni || !/^\d{7,8}$/.test(dni)) {
    return NextResponse.json({ error: "DNI inválido" }, { status: 400 })
  }

  const [partResult, remeraResult] = await Promise.all([
    supabaseAdmin
      .from("participantes")
      .select("dni, nombre, apellido, telefono")
      .eq("dni", dni)
      .maybeSingle(),
    supabaseAdmin
      .from("remera")
      .select("*")
      .eq("dni", dni)
      .maybeSingle(),
  ])

  return NextResponse.json({
    participante: partResult.data ?? null,
    remera: remeraResult.data ?? null,
  })
}
