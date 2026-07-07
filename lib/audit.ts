import { createClient } from '@/lib/supabase/client'

export type AuditAction =
  | 'core_team.member_added'
  | 'core_team.role_updated'
  | 'core_team.member_deactivated'
  | 'core_team.member_reactivated'
  | 'core_team.manage_team_granted'
  | 'core_team.manage_team_revoked'
  | 'contribution.verified'
  | 'contribution.rejected'
  | 'contribution.points_adjusted'
  | 'task.created'
  | 'task.updated'
  | 'task.assigned'
  | 'task.completed'
  | 'task.deleted'
  | 'contributor.approved'
  | 'contributor.rejected'
  | 'contributor.status_changed'

interface LogAuditParams {
  action: AuditAction
  target_type?: string
  target_id?: string
  target_label?: string
  metadata?: Record<string, unknown>
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    await fetch('/api/admin/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    })
  } catch {
    // Audit log failure must never break the main action
  }
}
