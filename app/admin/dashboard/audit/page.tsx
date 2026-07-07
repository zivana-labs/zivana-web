'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'

type LogEntry = {
  id: string
  actor_name: string
  action: string
  target_type: string | null
  target_id: string | null
  target_label: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'core_team.member_added':        { label: 'Member added',          color: '#5EEAD4' },
  'core_team.role_updated':        { label: 'Role updated',           color: '#A78BFA' },
  'core_team.member_deactivated':  { label: 'Member deactivated',    color: '#FCA5A5' },
  'core_team.member_reactivated':  { label: 'Member reactivated',    color: '#5EEAD4' },
  'core_team.manage_team_granted': { label: 'Access granted',        color: '#FCD34D' },
  'core_team.manage_team_revoked': { label: 'Access revoked',        color: '#FCA5A5' },
  'contribution.verified':         { label: 'Contribution verified',  color: '#5EEAD4' },
  'contribution.rejected':         { label: 'Contribution rejected',  color: '#FCA5A5' },
  'contribution.points_adjusted':  { label: 'Points adjusted',       color: '#FCD34D' },
  'task.created':                  { label: 'Task created',           color: '#7DD3FC' },
  'task.updated':                  { label: 'Task updated',           color: '#7DD3FC' },
  'task.assigned':                 { label: 'Task assigned',          color: '#A78BFA' },
  'task.completed':                { label: 'Task completed',         color: '#5EEAD4' },
  'task.deleted':                  { label: 'Task deleted',           color: '#FCA5A5' },
  'contributor.approved':          { label: 'Contributor approved',   color: '#5EEAD4' },
  'contributor.rejected':          { label: 'Contributor rejected',   color: '#FCA5A5' },
  'contributor.status_changed':    { label: 'Status changed',         color: '#FCD34D' },
}

function getActionDescription(action: string, targetLabel: string): string {
  switch (action) {
    case 'core_team.member_added':        return `added ${targetLabel} to the core team`
    case 'core_team.role_updated':        return `updated role for ${targetLabel}`
    case 'core_team.member_deactivated':  return `deactivated ${targetLabel}`
    case 'core_team.member_reactivated':  return `reactivated ${targetLabel}`
    case 'core_team.manage_team_granted': return `granted team management access to ${targetLabel}`
    case 'core_team.manage_team_revoked': return `revoked team management access from ${targetLabel}`
    case 'contribution.verified':         return `verified contribution by ${targetLabel}`
    case 'contribution.rejected':         return `rejected contribution by ${targetLabel}`
    case 'contribution.points_adjusted':  return `adjusted points for ${targetLabel}`
    case 'task.created':                  return `created task: ${targetLabel}`
    case 'task.updated':                  return `updated task: ${targetLabel}`
    case 'task.assigned':                 return `assigned task: ${targetLabel}`
    case 'task.completed':                return `marked task complete: ${targetLabel}`
    case 'task.deleted':                  return `deleted task: ${targetLabel}`
    case 'contributor.approved':          return `approved contributor ${targetLabel}`
    case 'contributor.rejected':          return `rejected contributor ${targetLabel}`
    case 'contributor.status_changed':    return `changed status for ${targetLabel}`
    default:                              return `acted on ${targetLabel}`
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function flattenMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata || Object.keys(metadata).length === 0) return ''
  return Object.entries(metadata)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function AuditContent() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [filterAction, setFilterAction] = useState('')
  const [filterActor, setFilterActor] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  async function fetchLogs() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (data) setLogs(data)
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const actors = Array.from(new Set(logs.map(l => l.actor_name))).sort()
  const actionTypes = Array.from(new Set(logs.map(l => l.action))).sort()

  function applyFilters(entries: LogEntry[]): LogEntry[] {
    return entries.filter(l => {
      if (filterAction && l.action !== filterAction) return false
      if (filterActor && l.actor_name !== filterActor) return false
      if (filterDateFrom && new Date(l.created_at) < new Date(filterDateFrom)) return false
      if (filterDateTo) {
        const to = new Date(filterDateTo)
        to.setHours(23, 59, 59, 999)
        if (new Date(l.created_at) > to) return false
      }
      return true
    })
  }

  const filtered = applyFilters(logs)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilters = filterAction || filterActor || filterDateFrom || filterDateTo

  function clearFilters() {
    setFilterAction('')
    setFilterActor('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setPage(1)
  }

  async function handleExport() {
    setExporting(true)
    const supabase = createClient()

    const BATCH_SIZE = 1000
    let allData: LogEntry[] = []
    let from = 0
    let keepFetching = true

    while (keepFetching) {
      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + BATCH_SIZE - 1)

      if (filterAction)   query = query.eq('action', filterAction)
      if (filterActor)    query = query.eq('actor_name', filterActor)
      if (filterDateFrom) query = query.gte('created_at', new Date(filterDateFrom).toISOString())
      if (filterDateTo) {
        const to = new Date(filterDateTo)
        to.setHours(23, 59, 59, 999)
        query = query.lte('created_at', to.toISOString())
      }

      const { data, error } = await query

      if (error || !data || data.length === 0) {
        keepFetching = false
      } else {
        allData = allData.concat(data)
        if (data.length < BATCH_SIZE) {
          keepFetching = false
        } else {
          from += BATCH_SIZE
        }
      }
    }

    if (allData.length === 0) {
      setExporting(false)
      return
    }

    const headers = ['Timestamp', 'Actor', 'Action', 'Target Type', 'Target', 'Metadata']
    const rows = allData.map(entry => [
      formatTime(entry.created_at),
      entry.actor_name,
      ACTION_LABELS[entry.action]?.label ?? entry.action,
      entry.target_type ?? '',
      entry.target_label ?? '',
      flattenMetadata(entry.metadata),
    ].map(escapeCSV).join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().split('T')[0]
    link.href = url
    link.download = `zivana-audit-${date}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const inputStyle = {
    padding: '8px 12px',
    background: '#0D0B14',
    border: '1px solid #1C1730',
    borderRadius: 8,
    color: '#E8E6F0',
    fontFamily: 'Switzer, sans-serif',
    fontSize: 12,
    outline: 'none',
  }

  return (
    <div className="min-h-screen bg-void pb-20">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-8 lg:px-12 pt-8 pb-4"
        style={{ background: '#0D0B14', borderBottom: '1px solid #1C1730' }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B7EC8' }}>
              Admin Panel
            </span>
            <h1 className="mt-2 mb-1" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(24px,4vw,40px)', letterSpacing: '-0.025em', color: '#E8E6F0', lineHeight: 1.1 }}>
              Audit Log
            </h1>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.75 }}>
              A record of all admin actions across the portal. Read only.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              borderRadius: 9999,
              border: '1px solid rgba(109,40,217,0.4)',
              background: 'rgba(109,40,217,0.1)',
              color: '#A78BFA',
              fontFamily: 'Switzer, sans-serif',
              fontSize: 13,
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.6 : 1,
              transition: 'all 0.2s',
              alignSelf: 'flex-start',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 1v8M4 6l3 3 3-3M1 10v1.5A1.5 1.5 0 0 0 2.5 13h9a1.5 1.5 0 0 0 1.5-1.5V10" />
            </svg>
            {exporting ? 'Exporting...' : `Export CSV${hasFilters ? ' (filtered)' : ''}`}
          </button>
        </div>
      </div>

      <div className="px-8 lg:px-12 pt-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1) }}
            style={inputStyle}
          >
            <option value="">All actions</option>
            {actionTypes.map(a => (
              <option key={a} value={a}>{ACTION_LABELS[a]?.label ?? a}</option>
            ))}
          </select>

          <select
            value={filterActor}
            onChange={(e) => { setFilterActor(e.target.value); setPage(1) }}
            style={inputStyle}
          >
            <option value="">All team members</option>
            {actors.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1) }}
            style={{ ...inputStyle, colorScheme: 'dark' }}
            placeholder="From date"
          />

          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => { setFilterDateTo(e.target.value); setPage(1) }}
            style={{ ...inputStyle, colorScheme: 'dark' }}
            placeholder="To date"
          />

          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid #1C1730',
                background: 'transparent', color: '#8B7EC8',
                fontFamily: 'Switzer, sans-serif', fontSize: 12, cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mb-4">
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#6B5FA0' }}>
            {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}${hasFilters ? ' matching filters' : ''}`}
          </span>
        </div>

        {/* Log entries */}
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 64, borderRadius: 12, background: '#13101E', border: '1px solid #1C1730', opacity: 0.5 }} />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#6B5FA0' }}>
            No entries found{hasFilters ? ' matching the current filters.' : '.'}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {paginated.map((entry) => {
              const config = ACTION_LABELS[entry.action] ?? { label: entry.action, color: '#A78BFA' }
              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 p-4 rounded-xl border"
                  style={{ background: '#13101E', borderColor: '#1C1730' }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: config.color + '15',
                      color: config.color,
                      border: `1px solid ${config.color}30`,
                      fontFamily: 'Switzer, sans-serif',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {config.label}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: '#E8E6F0' }}>
                          {entry.actor_name}
                        </span>
                        {entry.target_label && (
                          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#7B6FA8' }}>
                            {getActionDescription(entry.action, entry.target_label)}
                          </span>
                        )}
                      </div>
                    </div>

                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
                        {Object.entries(entry.metadata).map(([k, v]) => (
                          <span
                            key={k}
                            style={{
                              fontFamily: 'Switzer, sans-serif',
                              fontSize: 10,
                              color: '#6B5FA0',
                              background: '#0D0B14',
                              border: '1px solid #1C1730',
                              borderRadius: 6,
                              padding: '2px 8px',
                            }}
                          >
                            {k}: <span style={{ color: '#8B7EC8' }}>{String(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span style={{ flexShrink: 0, fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', whiteSpace: 'nowrap' }}>
                    {formatTime(entry.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid #1C1730' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 18px', borderRadius: 9999, border: '1px solid #1C1730',
                background: 'transparent', color: page === 1 ? '#2D2450' : '#8B7EC8',
                fontFamily: 'Switzer, sans-serif', fontSize: 13,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
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
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <AuditContent />
    </Suspense>
  )
}