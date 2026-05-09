import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'implicit',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
)

export const supabase = supabaseClient

export function createClient() {
  return supabaseClient
}