import { createClient, SupabaseClient } from '@supabase/supabase-js'

let publicClient: SupabaseClient | null = null

export function createPublicClient() {
  if (publicClient) return publicClient
  publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return publicClient
}