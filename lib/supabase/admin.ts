import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Solo usar en server-side (API routes).
// El service_role key bypasea RLS completamente.
// Lazy init para evitar error en build cuando las env vars no están disponibles.
let _client: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _client
}

// Alias para compatibilidad con código existente
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop]
  }
})
