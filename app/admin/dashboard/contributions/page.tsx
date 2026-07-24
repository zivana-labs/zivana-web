'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit'

type ReviewFeedback = {
  summary?: string
  issues?: { check: string; message: string }[]
  what_to_do?: string
  checks?: Record<string, boolean>
  score?: number
  resubmission_assessment?: {
    summary?: string
    previous_issues_resolved?: {
      check: string
      status: 'resolved' | 'partially_resolved' | 'unresolved'
      explanation: string
    }[]
  }
}

type Contribution = {
  id: string
  title: string
  description: string
  category: string
  complexity: string
  base_points: number
  final_points: number | null
  timing_multiplier: number
  status: string
  evidence_url: string | null
  notes: string | null
  created_at: string
  contributor_id: string | null
  task_id: string | null
  review_decision: string | null
  review_score: number | null
  review_feedback: ReviewFeedback | null
  submission_count: number | null
  contributors: {
    name: string
    email: string
    categories: string[]
  }
}

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

const STATUS_OPTIONS = ['all', 'submitted', 'ai_approved', 'under_review', 'verified', 'rejected']

const STATUS_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  submitted:    { bg: 'rgba(92,64,20,0.15)',   text: '#FCD34D', border: 'rgba(92,64,20,0.3)' },
  ai_approved:  { bg: 'rgba(14,165,233,0.12)', text: '#7DD3FC', border: 'rgba(14,165,233,0.25)' },
  under_review: { bg: 'rgba(28,95,138,0.15)',  text: '#7DD3FC', border: 'rgba(28,95,138,0.3)' },
  verified:     { bg: 'rgba(15,118,110,0.15)', text: '#5EEAD4', border: 'rgba(15,118,110,0.3)' },
  rejected:     { bg: 'rgba(127,29,29,0.15)',  text: '#FCA5A5', border: 'rgba(127,29,29,0.3)' },
}

const BASE_POINTS_RANGE: Record<string, Record<string, [number, number]>> = {
  technical:  { small: [50, 120],  medium: [150, 280], large: [300, 500] },
  design:     { small: [30, 80],   medium: [80, 160],  large: [180, 300] },
  research:   { small: [50, 100],  medium: [100, 200], large: [200, 400] },
  operations: { small: [30, 60],   medium: [80, 150],  large: [150, 200] },
  community:  { small: [10, 30],   medium: [60, 120],  large: [100, 150] },
}

function ContributionsContent() {
  const searchParams = useSearchParams()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get('filter') ?? 'submitted')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Contribution | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [basePoints, setBasePoints] = useState<number>(0)
  const [reviewNotes, setReviewNotes] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  async function fetchContributions() {
    const supabase = createClient()
    let query = supabase
      .from('contributions')
      .select(`
        *,
        contributors (name, email, categories)
      `)
      .order('updated_at', { ascending: false, nullsFirst: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    if (data) setContributions(data as any)
    setLoading(false)
  }

  useEffect(() => {
    fetchContributions()
  }, [filter])

  useEffect(() => {
    if (selected) {
      setBasePoints(selected.final_points ?? selected.base_points)
      setReviewNotes(selected.notes ?? '')
    }
  }, [selected])

  useEffect(() => {
    setPage(1)
  }, [filter, search])

  async function handleVerify() {
    if (!selected) return
    setActionLoading(true)
    const supabase = createClient()

    // MED-4 — clamp base_points to valid range server-side before writing
    const range = BASE_POINTS_RANGE[selected.category]?.[selected.complexity]
    const clampedBasePoints = range
      ? Math.max(range[0], Math.min(range[1], basePoints))
      : basePoints

    // H-2 — timing_multiplier is written by the client on submit; clamp it to the
    // legitimate range (0.8x late … 1.2x early) so a forged value cannot inflate points.
    const rawMultiplier = selected.timing_multiplier ?? 1.0
    const clampedMultiplier = Math.max(0.8, Math.min(1.2, rawMultiplier))
    const finalPoints = Math.round(clampedBasePoints * clampedMultiplier)

    // MED-5 — record which core team member performed the verification
    const { data: { user } } = await supabase.auth.getUser()
    let verifiedById: string | null = null

    if (user) {
      const { data: coreTeamMember } = await supabase
        .from('core_team')
        .select('id')
        .eq('user_id', user.id)
        .single()
      verifiedById = coreTeamMember?.id ?? null
    }

    const { error } = await supabase
      .from('contributions')
      .update({
        status: 'verified',
        final_points: finalPoints,
        base_points: clampedBasePoints,
        timing_multiplier: clampedMultiplier,
        notes: reviewNotes || null,
        verified_at: new Date().toISOString(),
        verified_by: verifiedById,
      })
      .eq('id', selected.id)

    if (!error) {
      // Complete the linked task if task_id exists
      if (selected.task_id) {
        await supabase
          .from('tasks')
          .update({ status: 'completed' })
          .eq('id', selected.task_id)
          .eq('status', 'assigned')
      } else if (selected.contributor_id) {
        // Fallback for contributions without task_id (submitted before this fix)
        // Match by contributor and title to find the stuck task
        const { data: matchedTask } = await supabase
          .from('tasks')
          .select('id')
          .eq('assigned_to', selected.contributor_id)
          .eq('status', 'assigned')
          .ilike('title', `%${selected.title.substring(0, 30)}%`)
          .maybeSingle()

        if (matchedTask) {
          await supabase
            .from('tasks')
            .update({ status: 'completed' })
            .eq('id', matchedTask.id)
        }
      }
      setActionSuccess('Contribution verified successfully')
      logAudit({
        action: 'contribution.verified',
        target_type: 'contribution',
        target_id: selected.id,
        target_label: selected.title,
        metadata: { points: finalPoints, category: selected.category },
      })
      setSelected(null)
      await fetchContributions()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(false)
  }

  async function handleReject() {
    if (!selected || !reviewNotes.trim()) return
    setActionLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('contributions')
      .update({
        status: 'rejected',
        notes: reviewNotes,
      })
      .eq('id', selected.id)

    if (!error) {
      setActionSuccess('Contribution rejected')
      logAudit({
        action: 'contribution.rejected',
        target_type: 'contribution',
        target_id: selected.id,
        target_label: selected.title,
        metadata: { notes: reviewNotes },
      })
      setSelected(null)
      await fetchContributions()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(false)
  }

  async function handleMarkUnderReview() {
    if (!selected) return
    setActionLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('contributions')
      .update({ status: 'under_review' })
      .eq('id', selected.id)

    if (!error) {
      setActionSuccess('Marked as under review')
      setSelected(null)
      await fetchContributions()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(false)
  }

  const filtered = contributions.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.contributors?.name?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const range = selected ? BASE_POINTS_RANGE[selected.category]?.[selected.complexity] : null

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
          Contributions
        </h1>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.75 }}>
          Review submitted work, set base points, and verify or reject contributions.
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
          placeholder="Search by title or contributor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '9px 14px',
            background: '#13101E',
            border: '1px solid #1C1730',
            borderRadius: 10,
            color: '#E8E6F0',
            fontFamily: 'Switzer, sans-serif',
            fontSize: 13,
            outline: 'none',
            maxWidth: 400,
            width: '100%',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
          onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
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
              {s === 'ai_approved' ? 'AI Approved' : s.replace('_', ' ')}
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

      {/* Contributions list */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730', height: 80, opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
          <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0', marginBottom: 6 }}>No contributions found</p>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paginated.map((c) => {
            const sc = STATUS_COLOURS[c.status] ?? STATUS_COLOURS.submitted
            const catColor = CATEGORY_COLOURS[c.category] ?? '#A78BFA'

            return (
              <div
                key={c.id}
                className="flex items-center gap-4 p-5 rounded-2xl border cursor-pointer"
                style={{
                  background: selected?.id === c.id ? 'rgba(109,40,217,0.06)' : '#13101E',
                  borderColor: selected?.id === c.id ? 'rgba(109,40,217,0.3)' : '#1C1730',
                  transition: 'all 0.2s',
                }}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#E8E6F0' }}>
                      {c.title}
                    </span>
                    <span style={{ padding: '1px 8px', borderRadius: 20, background: catColor + '15', color: catColor, border: `1px solid ${catColor}25`, fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {c.category}
                    </span>
                    <span style={{ padding: '1px 8px', borderRadius: 20, background: '#1E1640', color: '#6B5FA0', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {c.complexity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8' }}>
                      {c.contributors?.name ?? 'Unknown'}
                    </span>
                    <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {c.timing_multiplier !== 1.0 && (
                      <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: c.timing_multiplier > 1 ? '#5EEAD4' : '#FCA5A5' }}>
                        {c.timing_multiplier}x
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 text-right hidden sm:block">
                  <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: catColor, lineHeight: 1 }}>
                    {c.final_points ?? c.base_points}
                  </div>
                  <div style={{ fontFamily: 'Switzer, sans-serif', fontSize: 9, color: '#8B7EC8', marginTop: 2 }}>pts</div>
                </div>

                <span style={{ padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>
                  {c.status.replace('_', ' ')}
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

      {/* Review modal */}
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
              <div>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>
                  {selected.title}
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8', marginTop: 2 }}>
                  {selected.contributors?.name} — {selected.contributors?.email}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ padding: '3px 10px', borderRadius: 20, background: (CATEGORY_COLOURS[selected.category] ?? '#A78BFA') + '15', color: CATEGORY_COLOURS[selected.category] ?? '#A78BFA', border: `1px solid ${(CATEGORY_COLOURS[selected.category] ?? '#A78BFA')}25`, fontFamily: 'Switzer, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {selected.category}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: '#1E1640', color: '#6B5FA0', fontFamily: 'Switzer, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {selected.complexity}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: STATUS_COLOURS[selected.status]?.bg, color: STATUS_COLOURS[selected.status]?.text, border: `1px solid ${STATUS_COLOURS[selected.status]?.border}`, fontFamily: 'Switzer, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {selected.status.replace('_', ' ')}
                </span>
              </div>

              {/* Description */}
              <div>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Description</p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#E8E6F0', lineHeight: 1.7 }}>{selected.description}</p>
              </div>

              {/* Evidence */}
              {selected.evidence_url && (
                <div>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Evidence</p>
                  <a
                    href={selected.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#A78BFA', wordBreak: 'break-all' }}
                  >
                    {selected.evidence_url}
                  </a>
                </div>
              )}

              {/* AI review decision */}
              {selected.review_decision && (
                <div className="flex flex-col gap-3 p-4 rounded-xl border" style={{
                  background: selected.review_decision === 'approved'
                    ? 'rgba(15,118,110,0.06)'
                    : selected.review_decision === 'human_required'
                    ? 'rgba(234,179,8,0.06)'
                    : 'rgba(109,40,217,0.06)',
                  borderColor: selected.review_decision === 'approved'
                    ? 'rgba(15,118,110,0.2)'
                    : selected.review_decision === 'human_required'
                    ? 'rgba(234,179,8,0.2)'
                    : 'rgba(109,40,217,0.2)',
                }}>
                  {/* Header row */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span style={{
                        fontFamily: 'Switzer, sans-serif',
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#6B5FA0',
                      }}>
                        AI Review
                      </span>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: 20,
                        fontFamily: 'Switzer, sans-serif',
                        fontSize: 10,
                        fontWeight: 500,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        background: selected.review_decision === 'approved'
                          ? 'rgba(15,118,110,0.15)'
                          : selected.review_decision === 'human_required'
                          ? 'rgba(234,179,8,0.15)'
                          : 'rgba(109,40,217,0.12)',
                        color: selected.review_decision === 'approved'
                          ? '#5EEAD4'
                          : selected.review_decision === 'human_required'
                          ? '#FCD34D'
                          : '#A78BFA',
                      }}>
                        {selected.review_decision === 'human_required' ? 'Human required' : selected.review_decision}
                      </span>
                    </div>
                    {selected.review_score !== null && selected.review_score !== undefined && (
                      <div className="flex items-center gap-2">
                        <div style={{ width: 80, height: 6, borderRadius: 3, background: '#1C1730', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${selected.review_score}%`,
                            background: selected.review_score >= 80
                              ? '#5EEAD4'
                              : selected.review_score >= 50
                              ? '#FCD34D'
                              : '#A78BFA',
                            borderRadius: 3,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                        <span style={{
                          fontFamily: 'Cabinet Grotesk, sans-serif',
                          fontWeight: 600,
                          fontSize: 14,
                          color: selected.review_score >= 80 ? '#5EEAD4' : selected.review_score >= 50 ? '#FCD34D' : '#A78BFA',
                        }}>
                          {selected.review_score}/100
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submission count */}
                  {selected.submission_count && selected.submission_count > 1 && (
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>
                      Submission {selected.submission_count} of 3
                    </p>
                  )}

                  {/* AI feedback summary */}
                  {selected.review_feedback && selected.review_feedback.summary && (
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#C4B5FD', lineHeight: 1.65 }}>
                      {selected.review_feedback.summary}
                    </p>
                  )}

                  {/* Issues */}
                  {selected.review_feedback && Array.isArray(selected.review_feedback.issues) && selected.review_feedback.issues.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {selected.review_feedback.issues!.map((issue, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#A78BFA', marginTop: 5, flexShrink: 0 }} />
                          <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', lineHeight: 1.6 }}>
                            {issue.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Checks breakdown */}
                  {selected.review_feedback && selected.review_feedback.checks && (
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {Object.entries(selected.review_feedback.checks!).map(([check, passed]) => (
                        <div key={check} className="flex items-center gap-2">
                          <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: passed ? '#5EEAD4' : '#A78BFA',
                            flexShrink: 0,
                          }} />
                          <span style={{
                            fontFamily: 'Switzer, sans-serif',
                            fontSize: 10,
                            color: passed ? '#5EEAD4' : '#8B7EC8',
                            textTransform: 'capitalize',
                          }}>
                            {check.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* What to do */}
                  {selected.review_feedback && selected.review_feedback.what_to_do && (
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', lineHeight: 1.65, paddingTop: 8, borderTop: '1px solid #1C1730' }}>
                      <span style={{ color: '#A78BFA', fontWeight: 500 }}>Next steps: </span>
                      {selected.review_feedback.what_to_do}
                    </p>
                  )}

                  {/* Resubmission assessment */}
                  {selected.review_feedback && selected.review_feedback.resubmission_assessment && (
                    <div className="flex flex-col gap-3 p-4 rounded-xl border mt-2" style={{ background: '#0D0B14', borderColor: '#1C1730' }}>
                      <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5FA0' }}>
                        Previous feedback assessment
                      </p>
                      {selected.review_feedback.resubmission_assessment.summary && (
                        <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#C4B5FD', lineHeight: 1.65 }}>
                          {selected.review_feedback.resubmission_assessment.summary}
                        </p>
                      )}
                      {Array.isArray(selected.review_feedback.resubmission_assessment.previous_issues_resolved) && (
                        <div className="flex flex-col gap-2">
                          {selected.review_feedback.resubmission_assessment.previous_issues_resolved!.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: '#13101E', border: '1px solid #1C1730' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 20,
                                fontFamily: 'Switzer, sans-serif',
                                fontSize: 9,
                                fontWeight: 500,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                flexShrink: 0,
                                background: item.status === 'resolved'
                                  ? 'rgba(15,118,110,0.15)'
                                  : item.status === 'partially_resolved'
                                  ? 'rgba(234,179,8,0.15)'
                                  : 'rgba(109,40,217,0.1)',
                                color: item.status === 'resolved'
                                  ? '#5EEAD4'
                                  : item.status === 'partially_resolved'
                                  ? '#FCD34D'
                                  : '#8B7EC8',
                              }}>
                                {item.status.replace(/_/g, ' ')}
                              </span>
                              <div className="flex flex-col gap-1">
                                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, fontWeight: 500, color: '#E8E6F0' }}>
                                  {item.check.replace(/_/g, ' ')}
                                </p>
                                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', lineHeight: 1.6 }}>
                                  {item.explanation}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Timing multiplier */}
              {selected.timing_multiplier !== 1.0 && (
                <div className="p-4 rounded-xl border" style={{ background: selected.timing_multiplier > 1 ? 'rgba(15,118,110,0.08)' : 'rgba(239,68,68,0.08)', borderColor: selected.timing_multiplier > 1 ? 'rgba(15,118,110,0.2)' : 'rgba(239,68,68,0.2)' }}>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: selected.timing_multiplier > 1 ? '#5EEAD4' : '#FCA5A5' }}>
                    Timing multiplier: {selected.timing_multiplier}x — {selected.timing_multiplier > 1 ? 'Early submission bonus' : 'Late submission penalty'}
                  </p>
                </div>
              )}

              {/* Points input */}
              {(selected.status === 'submitted' || selected.status === 'under_review' || selected.status === 'ai_approved') && (
                <div>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Base points {range ? `(range: ${range[0]}–${range[1]})` : ''}
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={basePoints}
                      onChange={(e) => setBasePoints(Number(e.target.value))}
                      min={range?.[0] ?? 0}
                      max={range?.[1] ?? 1000}
                      style={{
                        width: 100,
                        padding: '9px 14px',
                        background: '#0D0B14',
                        border: '1px solid #1C1730',
                        borderRadius: 8,
                        color: '#E8E6F0',
                        fontFamily: 'Cabinet Grotesk, sans-serif',
                        fontSize: 16,
                        fontWeight: 600,
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                      onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                    />
                    <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
                      × {selected.timing_multiplier} = <span style={{ color: '#A78BFA', fontWeight: 600 }}>{Math.round(basePoints * (selected.timing_multiplier ?? 1.0))} final pts</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Review notes */}
              <div>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Review notes {selected.status === 'submitted' || selected.status === 'under_review' || selected.status === 'ai_approved' ? '(required for rejection)' : ''}
                </p>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes for the contributor..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#0D0B14',
                    border: '1px solid #1C1730',
                    borderRadius: 8,
                    color: '#E8E6F0',
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                  onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t flex flex-wrap gap-3" style={{ borderColor: '#1C1730' }}>
              {(selected.status === 'submitted' || selected.status === 'under_review' || selected.status === 'ai_approved') && (
                <>
                  <button
                    onClick={handleVerify}
                    disabled={actionLoading}
                    className="btn-primary"
                    style={{ fontSize: 13, opacity: actionLoading ? 0.7 : 1 }}
                  >
                    {actionLoading ? 'Verifying...' : 'Verify contribution'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading || !reviewNotes.trim()}
                    style={{
                      fontSize: 13,
                      padding: '10px 20px',
                      borderRadius: 9999,
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.08)',
                      color: '#FCA5A5',
                      fontFamily: 'Switzer, sans-serif',
                      cursor: actionLoading || !reviewNotes.trim() ? 'not-allowed' : 'pointer',
                      opacity: actionLoading || !reviewNotes.trim() ? 0.5 : 1,
                    }}
                  >
                    {actionLoading ? 'Rejecting...' : 'Reject'}
                  </button>
                  {selected.status === 'submitted' && (
                    <button
                      onClick={handleMarkUnderReview}
                      disabled={actionLoading}
                      style={{
                        fontSize: 13,
                        padding: '10px 20px',
                        borderRadius: 9999,
                        border: '1px solid #1C1730',
                        background: 'transparent',
                        color: '#8B7EC8',
                        fontFamily: 'Switzer, sans-serif',
                        cursor: 'pointer',
                        opacity: actionLoading ? 0.7 : 1,
                      }}
                    >
                      Mark under review
                    </button>
                  )}
                </>
              )}
              {selected.status === 'verified' && (
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#5EEAD4' }}>
                  This contribution has been verified with {selected.final_points} points.
                </p>
              )}
              {selected.status === 'rejected' && (
                <div className="flex flex-col gap-3 w-full">
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#FCA5A5' }}>
                    This contribution was rejected (often by the automated review). A core team
                    member can override and verify it manually if the rejection was incorrect.
                  </p>
                  <button
                    onClick={handleVerify}
                    disabled={actionLoading}
                    style={{
                      fontSize: 13,
                      padding: '10px 20px',
                      borderRadius: 9999,
                      border: '1px solid rgba(15,118,110,0.4)',
                      background: 'rgba(15,118,110,0.12)',
                      color: '#5EEAD4',
                      fontFamily: 'Switzer, sans-serif',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading ? 0.7 : 1,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {actionLoading ? 'Verifying...' : 'Verify anyway (override)'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ContributionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <ContributionsContent />
    </Suspense>
  )
}