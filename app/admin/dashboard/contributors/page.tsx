'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

type Contributor = {
  id: string
  name: string
  email: string
  categories: string[]
  contributor_type: string
  team_name: string
  location: string
  bio: string
  skills: string[]
  availability_hours_per_week: number
  github_handle: string
  twitter_handle: string
  linkedin_url: string
  portfolio_url: string
  status: string
  total_points: number
  verified_contributions: number
  created_at: string
}

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

const STATUS_OPTIONS = ['all', 'pending', 'active', 'inactive']

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function ContributorsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get('filter') ?? 'pending')

  function handleFilterChange(newFilter: string) {
    setFilter(newFilter)
    const params = new URLSearchParams(window.location.search)
    if (newFilter === 'pending') {
      params.delete('filter')
    } else {
      params.set('filter', newFilter)
    }
    router.replace(`/admin/dashboard/contributors?${params.toString()}`)
  }
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Contributor | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  async function fetchContributors() {
    const supabase = createClient()
    let query = supabase
      .from('contributors')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    if (data) setContributors(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchContributors()
  }, [filter])

  useEffect(() => {
    setPage(1)
  }, [filter, search])

  async function handleStatusChange(contributorId: string, newStatus: string, actionType: string) {
    setActionLoading(actionType)
    const supabase = createClient()

    const { error } = await supabase
      .from('contributors')
      .update({ status: newStatus })
      .eq('id', contributorId)

    if (!error) {
      // Send approval email via internal API route
      if (newStatus === 'active' && selected) {
        const contributorName = selected.contributor_type === 'team' && selected.team_name
          ? selected.team_name
          : selected.name

        await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selected.email,
            name: contributorName,
            subject: 'Your Zivana contributor account is approved',
            htmlContent: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0D0B14;padding:40px 32px;border-radius:16px;">
                <h1 style="font-size:22px;font-weight:600;color:#E8E6F0;margin:0 0 12px;letter-spacing:-0.02em;">
                  Welcome to Zivana, ${esc(contributorName)}
                </h1>
                <p style="font-size:15px;color:#7B6FA8;line-height:1.7;margin:0 0 24px;">
                  Your contributor application has been reviewed and approved by the core team. You now have full access to the contributor portal.
                </p>
                <p style="font-size:15px;color:#7B6FA8;line-height:1.7;margin:0 0 32px;">
                  Sign in to your dashboard to browse open tasks, claim work, and start earning points toward your $ZVN allocation at token launch.
                </p>
                <a href="https://zivana.network/contribute/signin"
                  style="display:inline-block;background:linear-gradient(135deg,#A78BFA,#6D28D9,#4C1D95);color:white;padding:14px 28px;border-radius:9999px;font-size:14px;font-weight:500;text-decoration:none;">
                  Sign in to your dashboard
                </a>
                <div style="margin-top:32px;padding-top:24px;border-top:1px solid #1C1730;">
                  <p style="font-size:11px;color:#2D2450;margin:0;">Zivana Network — zivana.network</p>
                  <p style="font-size:11px;color:#2D2450;margin:4px 0 0;">You are receiving this because you applied to contribute to Zivana Protocol.</p>
                </div>
              </div>
            `,
          }),
        })
      }

      setActionSuccess(`Contributor ${newStatus === 'active' ? 'approved' : newStatus} successfully`)
      setSelected(null)
      await fetchContributors()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(null)
  }

  const filtered = contributors.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const inputStyle = {
    padding: '9px 14px',
    background: '#13101E',
    border: '1px solid #1C1730',
    borderRadius: 10,
    color: '#E8E6F0',
    fontFamily: 'Switzer, sans-serif',
    fontSize: 13,
    outline: 'none',
  }

  return (
    <div className="min-h-screen bg-void pb-20">
      {/* Sticky header and filters */}
      <div
        className="sticky top-0 z-30 px-8 lg:px-12 pt-8 pb-4"
        style={{ background: '#0D0B14', borderBottom: '1px solid #1C1730' }}
      >
      {/* Header */}
      <div className="mb-4">
        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B7EC8' }}>
          Admin Panel
        </span>
        <h1 className="mt-2 mb-3" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(24px,4vw,40px)', letterSpacing: '-0.025em', color: '#E8E6F0', lineHeight: 1.1 }}>
          Contributors
        </h1>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.75 }}>
          Review applications, manage active contributors, and update statuses.
        </p>
      </div>

      {/* Success message */}
      {actionSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl border mb-6" style={{ background: 'rgba(15,118,110,0.1)', borderColor: 'rgba(15,118,110,0.25)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 8l4 4L14 3" />
          </svg>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#5EEAD4' }}>{actionSuccess}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: 400, width: '100%' }}
          onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
          onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: `1px solid ${filter === s ? '#6D28D9' : '#1C1730'}`,
                background: filter === s ? 'rgba(109,40,217,0.15)' : 'transparent',
                color: filter === s ? '#A78BFA' : '#8B7EC8',
                fontFamily: 'Switzer, sans-serif',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      </div>

      <div className="px-8 lg:px-12 pt-4">
        <div className="mb-4">
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
            {loading ? 'Loading...' : `Showing ${filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </span>
        </div>

      {/* Contributors list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730', height: 80, opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
          <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0', marginBottom: 6 }}>No contributors found</p>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginated.map((c) => {
            const isPending = c.status === 'pending'
            const isActive = c.status === 'active'
            const statusColor = isActive ? '#5EEAD4' : isPending ? '#FCD34D' : '#8B7EC8'
            const statusBg = isActive ? 'rgba(15,118,110,0.12)' : isPending ? 'rgba(234,179,8,0.12)' : 'rgba(255,255,255,0.05)'
            const statusBorder = isActive ? 'rgba(15,118,110,0.25)' : isPending ? 'rgba(234,179,8,0.25)' : 'rgba(255,255,255,0.1)'

            return (
              <div
                key={c.id}
                className="flex items-center gap-4 p-5 rounded-2xl border cursor-pointer"
                style={{
                  background: selected?.id === c.id ? 'rgba(109,40,217,0.06)' : '#13101E',
                  borderColor: selected?.id === c.id ? 'rgba(109,40,217,0.3)' : isPending ? 'rgba(234,179,8,0.2)' : '#1C1730',
                  transition: 'all 0.2s',
                }}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
              >
                {/* Avatar */}
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 40, height: 40, background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.25)' }}
                >
                  <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#A78BFA' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#E8E6F0' }}>
                      {c.contributor_type === 'team' && c.team_name ? c.team_name : c.name}
                    </span>
                    {c.categories?.map((cat) => {
                      const catColor = CATEGORY_COLOURS[cat] ?? '#A78BFA'
                      return (
                        <span key={cat} style={{ padding: '1px 8px', borderRadius: 20, background: catColor + '15', color: catColor, border: `1px solid ${catColor}25`, fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {cat}
                        </span>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8' }}>{c.email}</span>
                    {c.location && <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>{c.location}</span>}
                    <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="flex-shrink-0 text-right hidden sm:block">
                  <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#A78BFA', lineHeight: 1 }}>
                    {c.total_points.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: 'Switzer, sans-serif', fontSize: 9, color: '#8B7EC8', marginTop: 2 }}>points</div>
                </div>

                {/* Status */}
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: statusBg,
                    color: statusColor,
                    border: `1px solid ${statusBorder}`,
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  {c.status}
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
                padding: '8px 18px',
                borderRadius: 9999,
                border: '1px solid #1C1730',
                background: 'transparent',
                color: page === 1 ? '#2D2450' : '#8B7EC8',
                fontFamily: 'Switzer, sans-serif',
                fontSize: 13,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
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
                padding: '8px 18px',
                borderRadius: 9999,
                border: '1px solid #1C1730',
                background: 'transparent',
                color: page === totalPages ? '#2D2450' : '#8B7EC8',
                fontFamily: 'Switzer, sans-serif',
                fontSize: 13,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(13,11,20,0.92)', backdropFilter: 'blur(16px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border overflow-hidden"
            style={{ background: '#13101E', borderColor: '#1C1730', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#1C1730' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full" style={{ width: 40, height: 40, background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.25)' }}>
                  <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#A78BFA' }}>
                    {selected.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>
                    {selected.contributor_type === 'team' && selected.team_name ? selected.team_name : selected.name}
                  </p>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8' }}>{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            {/* Details */}
            <div className="p-6 flex flex-col gap-3">
              {[
                { label: 'Categories', value: selected.categories?.join(', ') },
                { label: 'Type', value: selected.contributor_type },
                { label: 'Location', value: selected.location },
                { label: 'Timezone', value: (selected as any).timezone },
                { label: 'Availability', value: selected.availability_hours_per_week ? `${selected.availability_hours_per_week} hrs/week` : null },
                { label: 'Skills', value: selected.skills?.join(', ') },
                { label: 'Bio', value: selected.bio },
                { label: 'GitHub', value: selected.github_handle ? `@${selected.github_handle}` : null },
                { label: 'Twitter', value: selected.twitter_handle ? `@${selected.twitter_handle}` : null },
                { label: 'LinkedIn', value: selected.linkedin_url },
                { label: 'Portfolio', value: selected.portfolio_url },
                { label: 'Points', value: selected.total_points.toLocaleString() },
                { label: 'Verified contributions', value: selected.verified_contributions.toString() },
                { label: 'Applied', value: new Date(selected.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].filter(f => f.value).map((f) => (
                <div key={f.label} className="grid grid-cols-3 gap-3 items-start">
                  <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>{f.label}</span>
                  <span className="col-span-2" style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#E8E6F0', wordBreak: 'break-all', lineHeight: 1.6 }}>{f.value}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-6 border-t flex flex-wrap gap-3" style={{ borderColor: '#1C1730' }}>
              {selected.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(selected.id, 'active', 'approve')}
                  disabled={actionLoading !== null}
                  className="btn-primary"
                  style={{ fontSize: 13, opacity: actionLoading !== null ? 0.7 : 1 }}
                >
                  {actionLoading === 'approve' ? 'Approving...' : 'Approve contributor'}
                </button>
              )}
              {selected.status === 'active' && (
                <button
                  onClick={() => handleStatusChange(selected.id, 'inactive', 'deactivate')}
                  disabled={actionLoading !== null}
                  style={{
                    fontSize: 13,
                    padding: '10px 20px',
                    borderRadius: 9999,
                    border: '1px solid rgba(239,68,68,0.3)',
                    background: 'rgba(239,68,68,0.08)',
                    color: '#FCA5A5',
                    fontFamily: 'Switzer, sans-serif',
                    cursor: 'pointer',
                    opacity: actionLoading !== null ? 0.7 : 1,
                  }}
                >
                  {actionLoading === 'deactivate' ? 'Deactivating...' : 'Deactivate'}
                </button>
              )}
              {selected.status === 'inactive' && (
                <button
                  onClick={() => handleStatusChange(selected.id, 'active', 'reactivate')}
                  disabled={actionLoading !== null}
                  className="btn-primary"
                  style={{ fontSize: 13, opacity: actionLoading !== null ? 0.7 : 1 }}
                >
                  {actionLoading === 'reactivate' ? 'Reactivating...' : 'Reactivate'}
                </button>
              )}
              {selected.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(selected.id, 'inactive', 'reject')}
                  disabled={actionLoading !== null}
                  style={{
                    fontSize: 13,
                    padding: '10px 20px',
                    borderRadius: 9999,
                    border: '1px solid #1C1730',
                    background: 'transparent',
                    color: '#8B7EC8',
                    fontFamily: 'Switzer, sans-serif',
                    cursor: 'pointer',
                    opacity: actionLoading !== null ? 0.7 : 1,
                  }}
                >
                  {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ContributorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <ContributorsContent />
    </Suspense>
  )
}