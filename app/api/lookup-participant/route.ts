export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dni = searchParams.get("dni")?.trim()

  if (!dni || dni.length < 7 || !/^\d+$/.test(dni)) {
    return NextResponse.json({ error: "DNI inválido" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("participantes")
    .select("nombre, apellido, email, telefono, pais_telefono, telefono_emergencia, pais_telefono_emergencia, fecha_nacimiento, localidad, grupo_sanguineo, genero, grupo_ciclistas")
    .eq("dni", dni)
    .maybeSingle()

  if (error) {
    console.error("[lookup-participant] Supabase error:", JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({ found: true, data })
}
