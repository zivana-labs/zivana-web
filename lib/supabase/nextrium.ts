import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Read-only Supabase client scoped to NexTrium's Supabase project.
 *
 * This is intentionally separate from the existing `zivana-contrib` client
 * (lib/supabase/client.ts and lib/supabase/server.ts), which points to a
 * different project with a different schema (contributors, tasks,
 * contributions, etc).
 *
 * Only the anon public key is used here. This client must never be given
 * the service role key — Zivana's codebase has no write access to
 * NexTrium's database, by design.
 *
 * Used exclusively for reading the `posts` table, filtered to
 * `brand = 'zivana'`, for the /blog and /blog/[slug] routes.
 */
const nextriumClient = createSupabaseClient(
  process.env.NEXTRIUM_SUPABASE_URL!,
  process.env.NEXTRIUM_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

export function createNextriumClient() {
  return nextriumClient
}