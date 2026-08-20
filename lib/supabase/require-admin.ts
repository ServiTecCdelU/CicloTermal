import { getSupabaseAdmin } from "@/lib/supabase/admin"

type Role = "admin" | "remera"

export interface AdminCheck {
  ok: boolean
  role: Role | null
  status: number
  error: string | null
}

/**
 * Valida el access token de Supabase que viene en el header Authorization
 * y verifica que el email tenga un rol habilitado en la tabla admins.
 *
 * Las API routes usan service_role (bypasea RLS), así que la autorización
 * tiene que hacerse acá explícitamente.
 */
export async function requireAdmin(
  request: Request,
  allowedRoles: Role[] = ["admin"],
): Promise<AdminCheck> {
  const header = request.headers.get("authorization") ?? ""
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""

  if (!token) {
    return { ok: false, role: null, status: 401, error: "No autenticado" }
  }

  const client = getSupabaseAdmin()
  const { data: userData, error: userError } = await client.auth.getUser(token)
  const email = userData?.user?.email

  if (userError || !email) {
    return { ok: false, role: null, status: 401, error: "Sesión inválida" }
  }

  const { data } = await client.from("admins").select("role").eq("email", email).single()
  const role = data?.role as Role | undefined

  if (!role || !allowedRoles.includes(role)) {
    return { ok: false, role: null, status: 403, error: "Sin permisos" }
  }

  return { ok: true, role, status: 200, error: null }
}
