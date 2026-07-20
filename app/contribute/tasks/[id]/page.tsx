'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createPublicClient } from '@/lib/supabase/public'
import DOMPurify from 'dompurify'

type Task = {
  id: string
  title: string
  description: string
  category: string
  complexity: string
  point_range_min: number
  point_range_max: number
  status: string
  deadline_days: number | null
  primitives: string[] | null
  links: { label: string; url: string }[] | null
  unclaimed_by: string[] | null
  unclaimed_at: string[] | null
  created_at: string
}

type Contributor = {
  id: string
  name: string
  max_claims: number
}

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

const PRIMITIVE_COLOURS: Record<string, string> = {
  trust:        '#5EEAD4',
  identity:     '#7DD3FC',
  reputation:   '#FCD34D',
  governance:   '#A78BFA',
  intelligence: '#C084FC',
  distribution: '#F9A8D4',
}

function TaskDetailContent() {
  const params = useParams()
  const router = useRouter()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [activeClaimCount, setActiveClaimCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const publicClient = createPublicClient()

      // Load contributor session if authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: contributorData } = await supabase
          .from('contributors')
          .select('id, name, max_claims')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()

        if (contributorData) {
          setContributor(contributorData)
          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', contributorData.id)
            .eq('status', 'assigned')
          setActiveClaimCount(count ?? 0)
        }
      }

      // Load task — public read
      const { data: taskData, error } = await publicClient
        .from('tasks')
        .select('id, title, description, category, complexity, point_range_min, point_range_max, status, deadline_days, primitives, links, unclaimed_by, unclaimed_at, created_at')
        .eq('id', taskId)
        .single()

      if (error || !taskData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      if (taskData.status !== 'open') {
        setNotFound(true)
        setLoading(false)
        return
      }

      setTask(taskData)
      setLoading(false)
    }
    load()
  }, [taskId])

  async function handleClaim() {
    if (!task || !contributor) {
      router.push('/contribute/signin')
      return
    }
    setClaiming(true)
    setClaimError('')

    const supabase = createClient()

    // H-5 — claiming must go through the same atomic claim_task RPC the contributor
    // dashboard uses. A direct table update here bypassed the 48-hour unclaim cooldown
    // and whatever max_claims / concurrency enforcement lives inside the RPC.
    const { data: canClaim } = await supabase
      .rpc('check_claim_cooldown', {
        task_id: task.id,
        contributor_id: contributor.id,
      })

    if (canClaim === false) {
      const unclaimIdx = task.unclaimed_by?.lastIndexOf(contributor.id) ?? -1
      const unclaimTime = unclaimIdx !== -1 && task.unclaimed_at
        ? new Date(task.unclaimed_at[unclaimIdx]).getTime()
        : null
      const hoursLeft = unclaimTime
        ? Math.ceil(48 - (Date.now() - unclaimTime) / (1000 * 60 * 60))
        : 48
      setClaimError(`You unclaimed this task recently. You can claim it again in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`)
      setClaiming(false)
      return
    }

    const now = new Date()
    const deadlineDays = task.complexity === 'small' ? 3 : task.complexity === 'medium' ? 6 : 12
    const deadlineAt = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000)

    const { data: claimResult, error } = await supabase
      .rpc('claim_task', {
        task_id: task.id,
        contributor_id: contributor.id,
        deadline_days_val: deadlineDays,
        deadline_at_val: deadlineAt.toISOString(),
      })

    if (error) {
      setClaimError('Failed to claim task. Please try again.')
      setClaiming(false)
      return
    }

    if (claimResult === false) {
      setClaimError('You unclaimed this task recently. You can claim it again in 48 hours.')
      setClaiming(false)
      return
    }

    if (claimResult === null) {
      setClaimError('This task was just claimed by someone else.')
      setClaiming(false)
      return
    }

    setClaimed(true)
    setClaiming(false)
  }

  function sanitize(html: string): string {
    if (typeof window === 'undefined') return ''
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'h2', 'h3', 'h4', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    })
  }

  const color = task ? (CATEGORY_COLOURS[task.category] ?? '#A78BFA') : '#A78BFA'
  const maxReached = contributor !== null && activeClaimCount >= (contributor.max_claims ?? 2)

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-void pt-36 pb-28 flex flex-col items-center justify-center px-8">
        <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 24, color: '#E8E6F0', marginBottom: 12 }}>
          Task not available
        </p>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#7B6FA8', marginBottom: 28 }}>
          This task may have already been claimed or does not exist.
        </p>
        <Link href="/contribute/tasks" className="btn-primary" style={{ fontSize: 13 }}>
          Browse open tasks
        </Link>
      </div>
    )
  }

  if (claimed) {
    return (
      <div className="min-h-screen bg-void pt-36 pb-28 flex flex-col items-center justify-center px-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(15,118,110,0.12)', border: '1px solid rgba(15,118,110,0.25)' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 14l7 7L24 7" />
          </svg>
        </div>
        <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 24, color: '#E8E6F0', marginBottom: 12 }}>
          Task claimed
        </p>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 15, color: '#7B6FA8', lineHeight: 1.7, marginBottom: 32, textAlign: 'center', maxWidth: 400 }}>
          You have claimed <span style={{ color: '#A78BFA' }}>{task?.title}</span>. Go to your dashboard to track your deadline and submit your work.
        </p>
        <div className="flex gap-3">
          <Link href="/contribute/dashboard" className="btn-primary" style={{ fontSize: 13 }}>
            Go to dashboard
          </Link>
          <Link href="/contribute/tasks" className="btn-outline" style={{ fontSize: 13 }}>
            Browse more tasks
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-void min-h-screen pt-36 pb-28">
      <div className="max-w-3xl mx-auto px-8 lg:px-14">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-10">
          <Link
            href="/contribute/tasks"
            style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Open tasks
          </Link>
          <span style={{ color: '#2D2450' }}>/</span>
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#6B5FA0' }}>{task!.title}</span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span style={{ padding: '3px 12px', borderRadius: 20, background: color + '18', color, border: `1px solid ${color}35`, fontFamily: 'Switzer, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {task!.category}
          </span>
          <span style={{ padding: '3px 12px', borderRadius: 20, background: '#1E1640', color: '#6B5FA0', fontFamily: 'Switzer, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {task!.complexity}
          </span>
          {task!.primitives?.map(p => (
            <span key={p} style={{ padding: '3px 12px', borderRadius: 20, background: (PRIMITIVE_COLOURS[p.toLowerCase()] ?? '#A78BFA') + '15', color: PRIMITIVE_COLOURS[p.toLowerCase()] ?? '#A78BFA', border: `1px solid ${PRIMITIVE_COLOURS[p.toLowerCase()] ?? '#A78BFA'}30`, fontFamily: 'Switzer, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {p} primitive
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(22px,3vw,36px)', letterSpacing: '-0.02em', lineHeight: 1.2, color: '#E8E6F0', marginBottom: 32 }}>
          {task!.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap gap-6 p-5 rounded-2xl border mb-10" style={{ background: '#13101E', borderColor: '#1C1730' }}>
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B5FA0' }}>Points</span>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 22, color, lineHeight: 1 }}>
              {task!.point_range_min}–{task!.point_range_max}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B5FA0' }}>Deadline</span>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 22, color: '#E8E6F0', lineHeight: 1 }}>
              {task!.deadline_days ?? (task!.complexity === 'small' ? 3 : task!.complexity === 'medium' ? 6 : 12)} days
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B5FA0' }}>Posted</span>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 22, color: '#E8E6F0', lineHeight: 1 }}>
              {new Date(task!.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Full description — rendered HTML */}
        <div
          className="task-description"
          dangerouslySetInnerHTML={{ __html: sanitize(task!.description ?? '') }}
          style={{ marginBottom: 40 }}
        />

        {/* Links and repositories */}
        {task!.links && task!.links.length > 0 && (
          <div className="p-5 rounded-2xl border mb-10" style={{ background: '#13101E', borderColor: '#1C1730' }}>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B5FA0', marginBottom: 12 }}>
              Links and repositories
            </p>
            <div className="flex flex-col gap-3">
              {task!.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url.startsWith('http://') || link.url.startsWith('https://') ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3"
                  style={{ textDecoration: 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M5 2H2v10h10V9M9 2h3v3M7 7l5-5" />
                  </svg>
                  <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#A78BFA' }}>
                    {link.label || link.url}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Claim section */}
        <div className="p-6 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
          {claimError && (
            <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#FCA5A5', marginBottom: 16 }}>
              {claimError}
            </p>
          )}

          {!contributor ? (
            <div className="flex flex-col gap-3">
              <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#7B6FA8', lineHeight: 1.7 }}>
                Sign in to claim this task and start earning points toward your $ZVN allocation.
              </p>
              <div className="flex gap-3">
                <Link href="/contribute/signin" className="btn-primary" style={{ fontSize: 13 }}>
                  Sign in to claim
                </Link>
                <Link href="/contribute/register" className="btn-outline" style={{ fontSize: 13 }}>
                  Register to contribute
                </Link>
              </div>
            </div>
          ) : maxReached ? (
            <div className="flex flex-col gap-3">
              <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#7B6FA8', lineHeight: 1.7 }}>
                You have reached your maximum of {contributor.max_claims} active claims. Complete or unclaim an existing task before claiming a new one.
              </p>
              <Link href="/contribute/dashboard" className="btn-primary" style={{ fontSize: 13 }}>
                Go to dashboard
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#7B6FA8', lineHeight: 1.7 }}>
                Claiming this task starts your {task!.deadline_days ?? (task!.complexity === 'small' ? 3 : task!.complexity === 'medium' ? 6 : 12)}-day deadline immediately. Submit your work from your dashboard before the deadline expires.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="btn-primary"
                  style={{ fontSize: 13, opacity: claiming ? 0.7 : 1 }}
                >
                  {claiming ? 'Claiming...' : 'Claim this task'}
                </button>
                <Link href="/contribute/tasks" className="btn-outline" style={{ fontSize: 13 }}>
                  Back to tasks
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .task-description {
          font-family: Switzer, sans-serif;
          font-size: 15px;
          line-height: 1.8;
          color: #C4B5FD;
        }
        .task-description > * + * {
          margin-top: 12px;
        }
        .task-description p {
          margin: 0 0 14px;
          color: #C4B5FD;
          line-height: 1.8;
        }
        .task-description h2 {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: clamp(17px, 2.5vw, 22px);
          font-weight: 600;
          color: #E8E6F0;
          margin: 32px 0 10px;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        .task-description h3 {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: clamp(14px, 2vw, 17px);
          font-weight: 600;
          color: #C4B5FD;
          margin: 24px 0 8px;
          line-height: 1.3;
        }
        .task-description ul {
          padding-left: 22px;
          margin: 8px 0 16px;
          list-style-type: disc;
        }
        .task-description ol {
          padding-left: 22px;
          margin: 8px 0 16px;
          list-style-type: decimal;
        }
        .task-description li {
          margin-bottom: 8px;
          color: #C4B5FD;
          line-height: 1.7;
          display: list-item;
        }
        .task-description ul li::marker {
          color: #A78BFA;
        }
        .task-description ol li::marker {
          color: #A78BFA;
        }
        .task-description strong {
          color: #E8E6F0;
          font-weight: 600;
        }
        .task-description em {
          color: #C4B5FD;
        }
        .task-description a {
          color: #A78BFA;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .task-description a:hover {
          color: #C4B5FD;
        }
        .task-description br {
          display: block;
          content: '';
          margin-top: 8px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function TaskDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <TaskDetailContent />
    </Suspense>
  )
}