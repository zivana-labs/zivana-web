'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit'

type CoreTeamMember = {
  id: string
  user_id: string | null
  email: string
  name: string
  role: string
  department: string
  permissions: string[]
  is_active: boolean
  joined_at: string
}

type Contributor = {
  id: string
  name: string
  email: string
  categories: string[]
  contributor_type: string
  team_name: string
  total_points: number
}

const ROLES = ['founder', 'lead', 'reviewer', 'coordinator']
const DEPARTMENTS = ['technical', 'design', 'community', 'research', 'operations', 'governance']

const ROLE_COLOURS: Record<string, string> = {
  founder:     '#FCD34D',
  lead:        '#A78BFA',
  reviewer:    '#7DD3FC',
  coordinator: '#5EEAD4',
}

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

function TeamContent() {
  const [members, setMembers] = useState<CoreTeamMember[]>([])
  const [currentMember, setCurrentMember] = useState<CoreTeamMember | null>(null)
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CoreTeamMember | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionError, setActionError] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  const [selectedContributorId, setSelectedContributorId] = useState('')
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'reviewer',
    department: 'technical',
  })

  const [editRole, setEditRole] = useState('')
  const [editDepartment, setEditDepartment] = useState('')
  const [togglingPermission, setTogglingPermission] = useState(false)

  async function fetchTeam() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: current } = await supabase
      .from('core_team')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (current) setCurrentMember(current)

    const { data } = await supabase
      .from('core_team')
      .select('*')
      .order('joined_at', { ascending: true })

    if (data) setMembers(data)
    setLoading(false)
  }

  async function fetchContributors() {
    const supabase = createClient()
    const { data } = await supabase
      .from('contributors')
      .select('id, name, email, categories, contributor_type, team_name, total_points')
      .eq('status', 'active')
      .order('name', { ascending: true })
    if (data) setContributors(data)
  }

  useEffect(() => {
    fetchTeam()
    fetchContributors()
  }, [])

  useEffect(() => {
    if (selected) {
      setEditRole(selected.role)
      setEditDepartment(selected.department)
    }
  }, [selected])

  // When a contributor is selected from the dropdown, pre-fill the form
  useEffect(() => {
    if (!selectedContributorId) return
    const c = contributors.find(c => c.id === selectedContributorId)
    if (!c) return
    const displayName = c.contributor_type === 'team' && c.team_name ? c.team_name : c.name
    setInviteForm(f => ({ ...f, name: displayName, email: c.email }))
  }, [selectedContributorId, contributors])

  const canManageTeam =
    currentMember?.role === 'founder' ||
    (currentMember?.permissions ?? []).includes('manage_core_team')

  const isFounder = currentMember?.role === 'founder'
  const totalPages = Math.ceil(members.length / PAGE_SIZE)
  const paginated = members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selectedContributor = contributors.find(c => c.id === selectedContributorId)

  function resetInviteModal() {
    setShowInviteForm(false)
    setActionError('')
    setSelectedContributorId('')
    setInviteForm({ name: '', email: '', role: 'reviewer', department: 'technical' })
  }

  async function handleInvite() {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return
    setActionLoading(true)
    setActionError('')
    const supabase = createClient()

    const { error } = await supabase
      .from('core_team')
      .insert({
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim().toLowerCase(),
        role: inviteForm.role,
        department: inviteForm.department,
        permissions: ['verify_contributions', 'assign_tasks'],
        is_active: true,
      })

    if (error) {
      setActionError(error.code === '23505' ? 'This email is already a core team member.' : error.message)
      setActionLoading(false)
      return
    }

    setActionSuccess('Core team member added successfully')
    logAudit({ action: 'core_team.member_added', target_type: 'core_team', target_label: inviteForm.name.trim(), metadata: { role: inviteForm.role, department: inviteForm.department } })
    resetInviteModal()
    await fetchTeam()
    setTimeout(() => setActionSuccess(''), 3000)
    setActionLoading(false)
  }

  async function handleUpdateRole() {
    if (!selected) return
    setActionLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('core_team')
      .update({ role: editRole, department: editDepartment })
      .eq('id', selected.id)

    if (!error) {
      setActionSuccess('Role updated successfully')
      logAudit({ action: 'core_team.role_updated', target_type: 'core_team', target_id: selected.id, target_label: selected.name, metadata: { role: editRole, department: editDepartment } })
      setSelected(null)
      await fetchTeam()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(false)
  }

  async function handleToggleManageTeam(member: CoreTeamMember) {
    setTogglingPermission(true)
    const supabase = createClient()
    const hasPermission = member.permissions.includes('manage_core_team')
    const updatedPermissions = hasPermission
      ? member.permissions.filter(p => p !== 'manage_core_team')
      : [...member.permissions, 'manage_core_team']

    const { error } = await supabase
      .from('core_team')
      .update({ permissions: updatedPermissions })
      .eq('id', member.id)

    if (!error) {
      setActionSuccess(hasPermission ? 'Team management access revoked' : 'Team management access granted')
      logAudit({ action: hasPermission ? 'core_team.manage_team_revoked' : 'core_team.manage_team_granted', target_type: 'core_team', target_id: member.id, target_label: member.name })
      setSelected(null)
      await fetchTeam()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setTogglingPermission(false)
  }

  async function handleDeactivate(memberId: string) {
    if (!window.confirm('Are you sure you want to deactivate this core team member?')) return
    setActionLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('core_team')
      .update({ is_active: false })
      .eq('id', memberId)

    if (!error) {
      setActionSuccess('Member deactivated')
      logAudit({ action: 'core_team.member_deactivated', target_type: 'core_team', target_id: memberId })
      setSelected(null)
      await fetchTeam()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(false)
  }

  async function handleReactivate(memberId: string) {
    setActionLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('core_team')
      .update({ is_active: true })
      .eq('id', memberId)

    if (!error) {
      setActionSuccess('Member reactivated')
      logAudit({ action: 'core_team.member_reactivated', target_type: 'core_team', target_id: memberId })
      setSelected(null)
      await fetchTeam()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 14px',
    background: '#0D0B14',
    border: '1px solid #1C1730',
    borderRadius: 8,
    color: '#E8E6F0',
    fontFamily: 'Switzer, sans-serif',
    fontSize: 13,
    outline: 'none',
  }

  const labelStyle = {
    fontFamily: 'Switzer, sans-serif',
    fontSize: 11,
    color: '#6B5FA0',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: 6,
  }

  if (!canManageTeam) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-8">
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(109,40,217,0.12)', border: '1px solid rgba(109,40,217,0.25)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 22, color: '#E8E6F0', marginBottom: 8 }}>
            Access restricted
          </h2>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.7 }}>
            Core team management requires founder access or the team management permission. Contact the founder to request access.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void pb-20">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 px-8 lg:px-12 pt-8 pb-4"
        style={{ background: '#0D0B14', borderBottom: '1px solid #1C1730' }}
      >
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B7EC8' }}>
              Admin Panel
            </span>
            <h1 className="mt-2 mb-3" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(24px,4vw,40px)', letterSpacing: '-0.025em', color: '#E8E6F0', lineHeight: 1.1 }}>
              Core Team
            </h1>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.75 }}>
              Manage core team members, roles, and permissions.
            </p>
          </div>
          <button
            onClick={() => setShowInviteForm(true)}
            className="btn-primary"
            style={{ fontSize: 13, alignSelf: 'flex-start' }}
          >
            + Add member
          </button>
        </div>
      </div>

      <div className="px-8 lg:px-12 pt-4">
        <div className="mb-4">
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
            {loading ? 'Loading...' : `Showing ${members.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, members.length)} of ${members.length}`}
          </span>
        </div>

        {actionSuccess && (
          <div className="flex items-center gap-3 p-4 rounded-xl border mb-6" style={{ background: 'rgba(15,118,110,0.1)', borderColor: 'rgba(15,118,110,0.25)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 8l4 4L14 3" />
            </svg>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#5EEAD4' }}>{actionSuccess}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730', height: 80, opacity: 0.5 }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginated.map((member) => {
              const roleColor = ROLE_COLOURS[member.role] ?? '#A78BFA'
              const isCurrentUser = member.id === currentMember?.id
              const hasManageTeam = member.permissions.includes('manage_core_team')

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-5 rounded-2xl border cursor-pointer"
                  style={{
                    background: selected?.id === member.id ? 'rgba(109,40,217,0.06)' : '#13101E',
                    borderColor: selected?.id === member.id ? 'rgba(109,40,217,0.3)' : isCurrentUser ? 'rgba(109,40,217,0.2)' : '#1C1730',
                    opacity: member.is_active ? 1 : 0.5,
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelected(selected?.id === member.id ? null : member)}
                >
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 40, height: 40, background: roleColor + '18', border: `1px solid ${roleColor}35` }}
                  >
                    <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: roleColor }}>
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#E8E6F0' }}>
                        {member.name}
                      </span>
                      {isCurrentUser && (
                        <span style={{ padding: '1px 8px', borderRadius: 20, background: 'rgba(109,40,217,0.15)', color: '#A78BFA', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          You
                        </span>
                      )}
                      {hasManageTeam && member.role !== 'founder' && (
                        <span style={{ padding: '1px 8px', borderRadius: 20, background: 'rgba(252,211,77,0.1)', color: '#FCD34D', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Team mgmt
                        </span>
                      )}
                      {!member.is_active && (
                        <span style={{ padding: '1px 8px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8' }}>{member.email}</span>
                      <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', textTransform: 'capitalize' }}>{member.department}</span>
                      <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>
                        Since {new Date(member.joined_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: roleColor + '15',
                    color: roleColor,
                    border: `1px solid ${roleColor}30`,
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}>
                    {member.role}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid #1C1730' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 18px', borderRadius: 9999, border: '1px solid #1C1730',
                background: 'transparent', color: page === 1 ? '#2D2450' : '#8B7EC8',
                fontFamily: 'Switzer, sans-serif', fontSize: 13,
                cursor: page === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              }}
            >
              Previous
            </button>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '8px 18px', borderRadius: 9999, border: '1px solid #1C1730',
                background: 'transparent', color: page === totalPages ? '#2D2450' : '#8B7EC8',
                fontFamily: 'Switzer, sans-serif', fontSize: 13,
                cursor: page === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit member modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(13,11,20,0.92)', backdropFilter: 'blur(16px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border overflow-hidden"
            style={{ background: '#13101E', borderColor: '#1C1730' }}
          >
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#1C1730' }}>
              <div>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>{selected.name}</p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8', marginTop: 2 }}>{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={inputStyle}
                    disabled={selected.id === currentMember?.id}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    style={inputStyle}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {selected.id === currentMember?.id && (
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#6B5FA0', lineHeight: 1.6 }}>
                  You cannot change your own role. Ask another founder to update it.
                </p>
              )}

              {/* Team management permission toggle — founder only, not on self, not on other founders */}
              {isFounder && selected.id !== currentMember?.id && selected.role !== 'founder' && (
                <div
                  className="flex items-start justify-between gap-4 p-4 rounded-xl border"
                  style={{ background: 'rgba(109,40,217,0.05)', borderColor: 'rgba(109,40,217,0.18)' }}
                >
                  <div>
                    <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: '#E8E6F0', marginBottom: 4 }}>
                      Team management access
                    </p>
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#7B6FA8', lineHeight: 1.6 }}>
                      Grants full operational capacity to add members, update roles, and manage the team. Only you can revoke this.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleManageTeam(selected)}
                    disabled={togglingPermission}
                    style={{
                      flexShrink: 0,
                      padding: '6px 16px',
                      borderRadius: 9999,
                      border: selected.permissions.includes('manage_core_team')
                        ? '1px solid rgba(239,68,68,0.3)'
                        : '1px solid rgba(109,40,217,0.4)',
                      background: selected.permissions.includes('manage_core_team')
                        ? 'rgba(239,68,68,0.08)'
                        : 'rgba(109,40,217,0.12)',
                      color: selected.permissions.includes('manage_core_team') ? '#FCA5A5' : '#A78BFA',
                      fontFamily: 'Switzer, sans-serif',
                      fontSize: 12,
                      cursor: togglingPermission ? 'not-allowed' : 'pointer',
                      opacity: togglingPermission ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {togglingPermission
                      ? 'Saving...'
                      : selected.permissions.includes('manage_core_team')
                        ? 'Revoke'
                        : 'Grant'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex flex-wrap gap-3" style={{ borderColor: '#1C1730' }}>
              <button
                onClick={handleUpdateRole}
                disabled={actionLoading || selected.id === currentMember?.id}
                className="btn-primary"
                style={{ fontSize: 13, opacity: actionLoading || selected.id === currentMember?.id ? 0.5 : 1 }}
              >
                {actionLoading ? 'Saving...' : 'Save changes'}
              </button>
              {selected.is_active && selected.id !== currentMember?.id && (
                <button
                  onClick={() => handleDeactivate(selected.id)}
                  disabled={actionLoading}
                  style={{
                    fontSize: 13, padding: '10px 20px', borderRadius: 9999,
                    border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                    color: '#FCA5A5', fontFamily: 'Switzer, sans-serif', cursor: 'pointer',
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  Deactivate
                </button>
              )}
              {!selected.is_active && (
                <button
                  onClick={() => handleReactivate(selected.id)}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{ fontSize: 13, opacity: actionLoading ? 0.7 : 1 }}
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {showInviteForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(13,11,20,0.92)', backdropFilter: 'blur(16px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) resetInviteModal() }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border overflow-hidden"
            style={{ background: '#13101E', borderColor: '#1C1730' }}
          >
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#1C1730' }}>
              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0' }}>Add core team member</p>
              <button
                onClick={resetInviteModal}
                style={{ color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
              >
                ×
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div className="p-4 rounded-xl border" style={{ background: 'rgba(109,40,217,0.06)', borderColor: 'rgba(109,40,217,0.2)' }}>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#A78BFA', lineHeight: 1.65 }}>
                  Adding a member here creates their core team record. They will need to sign in with the magic link to access the admin panel. Their email must match exactly.
                </p>
              </div>

              {actionError && (
                <div className="p-4 rounded-xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#FCA5A5' }}>{actionError}</p>
                </div>
              )}

              {/* Contributor selector — same pattern as direct task assignment */}
              <div>
                <label style={labelStyle}>Select from active contributors</label>
                <select
                  value={selectedContributorId}
                  onChange={(e) => setSelectedContributorId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Choose a contributor...</option>
                  {contributors.map((c) => {
                    const displayName = c.contributor_type === 'team' && c.team_name ? c.team_name : c.name
                    return (
                      <option key={c.id} value={c.id}>
                        {displayName} — {c.email}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Selected contributor preview card */}
              {selectedContributor && (() => {
                const displayName = selectedContributor.contributor_type === 'team' && selectedContributor.team_name
                  ? selectedContributor.team_name
                  : selectedContributor.name
                return (
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(109,40,217,0.06)', border: '1px solid rgba(109,40,217,0.15)' }}>
                    <div
                      className="flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ width: 36, height: 36, background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.25)' }}
                    >
                      <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#A78BFA' }}>
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#E8E6F0' }}>{displayName}</p>
                      <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', marginTop: 2 }}>{selectedContributor.email}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {selectedContributor.categories?.map(cat => {
                          const catColor = CATEGORY_COLOURS[cat] ?? '#A78BFA'
                          return (
                            <span key={cat} style={{ padding: '1px 6px', borderRadius: 10, background: catColor + '15', color: catColor, fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              {cat}
                            </span>
                          )
                        })}
                        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8' }}>
                          {selectedContributor.total_points} pts
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#1C1730' }} />
                <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#4A3E7A' }}>or enter manually</span>
                <div style={{ flex: 1, height: 1, background: '#1C1730' }} />
              </div>

              <div>
                <label style={labelStyle}>Full name</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="Adunola Fashola"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                  onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                />
              </div>
              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="team@example.com"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                  onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                    style={inputStyle}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <select
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    style={inputStyle}
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3" style={{ borderColor: '#1C1730' }}>
              <button
                onClick={handleInvite}
                disabled={actionLoading || !inviteForm.name.trim() || !inviteForm.email.trim()}
                className="btn-primary"
                style={{ fontSize: 13, opacity: actionLoading || !inviteForm.name.trim() || !inviteForm.email.trim() ? 0.5 : 1 }}
              >
                {actionLoading ? 'Adding...' : 'Add member'}
              </button>
              <button
                onClick={resetInviteModal}
                className="btn-outline"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TeamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <TeamContent />
    </Suspense>
  )
}