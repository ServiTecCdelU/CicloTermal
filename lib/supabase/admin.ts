import { createClient } from '@supabase/supabase-js'

// Solo usar en server-side (API routes).
// El service_role key bypasea RLS completamente.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
