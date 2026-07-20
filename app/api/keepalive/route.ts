import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Cron diario (Vercel) → suma 1 en Supabase para evitar pausa por inactividad.
export async function GET() {
  const { data, error } = await supabaseAdmin.rpc("increment_keepalive")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, count: data })
}
