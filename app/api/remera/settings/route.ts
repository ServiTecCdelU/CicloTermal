export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function GET() {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("data")
    .eq("id", "remera")
    .single()

  return NextResponse.json({
    alias: data?.data?.alias ?? null,
    precio: data?.data?.precio ?? null,
  })
}
