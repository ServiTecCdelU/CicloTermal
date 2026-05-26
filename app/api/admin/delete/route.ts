import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

const ALLOWED_TABLES = ["sponsors", "bike_friendly"]

export async function DELETE(request: NextRequest) {
  const { table, id } = await request.json()

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: "Tabla no permitida" }, { status: 403 })
  }

  const { error } = await supabaseAdmin.from(table).delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
