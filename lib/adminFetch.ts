import { createClient } from '@/lib/supabase/client'

/**
 * Build JSON headers carrying the current session's bearer token, for calling
 * internal admin API routes that verify an active core-team member server-side
 * (e.g. /api/email/send, /api/admin/audit). Without a session the Authorization
 * header is simply omitted and the route rejects the request.
 */
export async function authedJsonHeaders(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
  return headers
}
