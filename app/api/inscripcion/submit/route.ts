import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dni, añoParam, perfilPersonal, datosCiclo, grupoIngresado, gruposExistentes } = body

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
      comprobante_pago_url: null,
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
