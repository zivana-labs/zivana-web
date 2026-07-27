'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import DOMPurify from 'dompurify'

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

const STATUS_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  submitted:    { bg: 'rgba(92,64,20,0.15)',    text: '#FCD34D', border: 'rgba(92,64,20,0.3)' },
  under_review: { bg: 'rgba(28,95,138,0.15)',   text: '#7DD3FC', border: 'rgba(28,95,138,0.3)' },
  ai_approved:  { bg: 'rgba(14,165,233,0.12)',  text: '#7DD3FC', border: 'rgba(14,165,233,0.25)' },
  verified:     { bg: 'rgba(15,118,110,0.15)',  text: '#5EEAD4', border: 'rgba(15,118,110,0.3)' },
  rejected:     { bg: 'rgba(127,29,29,0.15)',   text: '#FCA5A5', border: 'rgba(127,29,29,0.3)' },
}

type ReviewFeedback = {
  summary?: string
  issues?: { check: string; message: string }[]
  what_to_do?: string
  checks?: Record<string, boolean>
  score?: number
}

type TaskRef = {
  id: string
  title: string
  description: string | null
  category: string | null
  complexity: string | null
  status: string | null
  point_range_min: number | null
  point_range_max: number | null
  deadline_days: number | null
  primitives: string[] | null
  links: { label: string; url: string }[] | null
} | null

type Submission = {
  id: string
  title: string
  description: string | null
  category: string
  complexity: string
  base_points: number
  final_points: number | null
  timing_multiplier: number | null
  deadline_at: string | null
  evidence_url: string | null
  notes: string | null
  status: string
  submission_count: number | null
  review_decision: string | null
  review_score: number | null
  review_feedback: ReviewFeedback | null
  verified_at: string | null
  created_at: string
  updated_at: string | null
  contributor_id: string
  task_id: string | null
  tasks: TaskRef
}

const label = {
  fontFamily: 'Switzer, sans-serif',
  fontSize: 11,
  color: '#8B7EC8',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  display: 'block',
  marginBottom: 6,
}
const value = {
  fontFamily: 'Switzer, sans-serif',
  fontSize: 14,
  color: '#E8E6F0',
  lineHeight: 1.6,
}
const card = {
  background: '#13101E',
  border: '1px solid #1C1730',
  borderRadius: 16,
  padding: 24,
}

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Task descriptions are HTML from the Tiptap editor, so they must be sanitized
// and rendered as HTML rather than printed as text. Same allowlist as the task
// detail pages.
function sanitize(html: string): string {
  if (typeof window === 'undefined') return ''
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'h4', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  })
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [sub, setSub] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/contribute'); return }

      // RLS scopes contributions SELECT to the owner, so a non-owner's fetch
      // returns no row and falls through to "Submission not found" below.
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          *,
          tasks ( id, title, description, category, complexity, status,
                   point_range_min, point_range_max, deadline_days, primitives, links )
        `)
        .eq('id', id)
        .single()

      if (error || !data) { setError('Submission not found.'); setLoading(false); return }
      setSub(data as Submission)
      setLoading(false)
    }
    run()
  }, [id, router])

  if (loading) {
    return (
      <div className="bg-void min-h-screen pt-36 pb-28 flex items-center justify-center">
        <p style={{ fontFamily: 'Switzer, sans-serif', color: '#8B7EC8' }}>Loading…</p>
      </div>
    )
  }

  if (error || !sub) {
    return (
      <div className="bg-void min-h-screen pt-36 pb-28 flex flex-col items-center justify-center gap-4">
        <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 20, color: '#E8E6F0' }}>
          {error || 'Not found'}
        </p>
        <Link href="/contribute/dashboard?tab=contributions" className="btn-outline" style={{ fontSize: 13 }}>
          Back to submissions
        </Link>
      </div>
    )
  }

  const sc = STATUS_COLOURS[sub.status] ?? STATUS_COLOURS.submitted
  const cc = CATEGORY_COLOURS[sub.category] ?? '#A78BFA'
  const fb = sub.review_feedback

  return (
    <div className="bg-void min-h-screen pt-36 pb-28">
      <div className="max-w-3xl mx-auto px-8 lg:px-14">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/contribute/dashboard?tab=contributions"
            style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8', textDecoration: 'none' }}>
            Submissions
          </Link>
          <span style={{ color: '#6B5FA0' }}>/</span>
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#7B6FA8' }}>Detail</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(24px,3vw,40px)', letterSpacing: '-0.02em', lineHeight: 1.1, color: '#E8E6F0', marginBottom: 10 }}>
              {sub.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: cc, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{sub.category}</span>
              <span style={{ color: '#6B5FA0' }}>·</span>
              <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', textTransform: 'capitalize' }}>{sub.complexity}</span>
              {sub.submission_count && sub.submission_count > 1 && (
                <>
                  <span style={{ color: '#6B5FA0' }}>·</span>
                  <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>Submission {sub.submission_count}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ padding: '4px 12px', borderRadius: 20, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontFamily: 'Switzer, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {sub.status.replace('_', ' ')}
            </span>
            <div className="text-right">
              <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, color: cc, lineHeight: 1 }}>
                {sub.final_points ?? sub.base_points}
              </div>
              <div style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: '#8B7EC8', marginTop: 2 }}>pts</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">

          {/* What the contributor submitted */}
          <div style={card}>
            <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0', marginBottom: 16 }}>
              Submission
            </p>

            <div className="mb-5">
              <span style={label}>Description</span>
              <p style={value}>{sub.description || <span style={{ color: '#6B5FA0' }}>No description provided.</span>}</p>
            </div>

            <div className="mb-5">
              <span style={label}>Evidence</span>
              {sub.evidence_url ? (
                <a href={sub.evidence_url} target="_blank" rel="noreferrer"
                  style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#A78BFA', wordBreak: 'break-all', textDecoration: 'none' }}>
                  {sub.evidence_url} ↗
                </a>
              ) : (
                <p style={{ ...value, color: '#6B5FA0' }}>No evidence link.</p>
              )}
            </div>

            {sub.notes && (
              <div>
                <span style={label}>Notes</span>
                <p style={value}>{sub.notes}</p>
              </div>
            )}
          </div>

          {/* Scoring */}
          <div style={card}>
            <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0', marginBottom: 16 }}>
              Scoring
            </p>
            <div className="grid sm:grid-cols-2 gap-y-5 gap-x-8">
              <div><span style={label}>Base points</span><p style={value}>{sub.base_points}</p></div>
              <div><span style={label}>Final points</span><p style={value}>{sub.final_points ?? '—'}</p></div>
              <div><span style={label}>Timing multiplier</span><p style={value}>{sub.timing_multiplier ?? 1}×</p></div>
              <div><span style={label}>Review score</span><p style={value}>{sub.review_score ?? '—'}</p></div>
              <div><span style={label}>Submitted</span><p style={value}>{fmt(sub.created_at)}</p></div>
              <div><span style={label}>Deadline</span><p style={value}>{fmt(sub.deadline_at)}</p></div>
              <div><span style={label}>Verified</span><p style={value}>{fmt(sub.verified_at)}</p></div>
              <div><span style={label}>Last updated</span><p style={value}>{fmt(sub.updated_at ?? sub.created_at)}</p></div>
            </div>
          </div>

          {/* AI / review feedback */}
          {fb && (fb.summary || fb.what_to_do || (fb.issues && fb.issues.length) || fb.checks) && (
            <div style={card}>
              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0', marginBottom: 16 }}>
                Review feedback
              </p>
              {fb.summary && (
                <div className="mb-5"><span style={label}>Summary</span><p style={value}>{fb.summary}</p></div>
              )}
              {fb.issues && fb.issues.length > 0 && (
                <div className="mb-5">
                  <span style={label}>Issues</span>
                  <ul className="flex flex-col gap-2 mt-1">
                    {fb.issues.map((it, i) => (
                      <li key={i} style={{ ...value, fontSize: 13 }}>
                        <span style={{ color: '#FCA5A5' }}>• {it.check}:</span> {it.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fb.what_to_do && (
                <div className="mb-5"><span style={label}>What to do</span><p style={value}>{fb.what_to_do}</p></div>
              )}
              {fb.checks && Object.keys(fb.checks).length > 0 && (
                <div>
                  <span style={label}>Checks</span>
                  <div className="flex flex-col gap-1 mt-1">
                    {Object.entries(fb.checks).map(([k, v]) => (
                      <div key={k} style={{ ...value, fontSize: 13, color: v ? '#5EEAD4' : '#FCA5A5' }}>
                        {v ? '✓' : '✗'} {k}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Linked task */}
          {sub.tasks && (
            <div style={card}>
              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0', marginBottom: 16 }}>
                Linked task
              </p>
              <div className="mb-4">
                <span style={label}>Title</span>
                <Link href={`/contribute/tasks/${sub.tasks.id}`}
                  style={{ ...value, color: '#A78BFA', textDecoration: 'none' }}>
                  {sub.tasks.title} ↗
                </Link>
              </div>
              {sub.tasks.description && (
                <div className="mb-4">
                  <span style={label}>Task description</span>
                  <div style={value} dangerouslySetInnerHTML={{ __html: sanitize(sub.tasks.description) }} />
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                <div><span style={label}>Status</span><p style={{ ...value, textTransform: 'capitalize' }}>{sub.tasks.status ?? '—'}</p></div>
                <div><span style={label}>Point range</span><p style={value}>{sub.tasks.point_range_min ?? '—'}–{sub.tasks.point_range_max ?? '—'}</p></div>
                <div><span style={label}>Deadline window</span><p style={value}>{sub.tasks.deadline_days ? `${sub.tasks.deadline_days} days` : '—'}</p></div>
                {sub.tasks.primitives && sub.tasks.primitives.length > 0 && (
                  <div><span style={label}>Primitives</span><p style={value}>{sub.tasks.primitives.join(', ')}</p></div>
                )}
              </div>
              {sub.tasks.links && sub.tasks.links.length > 0 && (
                <div className="mt-4">
                  <span style={label}>Task links</span>
                  <div className="flex flex-col gap-1 mt-1">
                    {sub.tasks.links.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noreferrer"
                        style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#A78BFA', textDecoration: 'none' }}>
                        {l.label || l.url} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Link href="/contribute/dashboard?tab=contributions" className="btn-outline self-start" style={{ fontSize: 13 }}>
            Back to submissions
          </Link>
        </div>
      </div>
    </div>
  )
}
