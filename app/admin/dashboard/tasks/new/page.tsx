'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor'), { ssr: false })

type Contributor = {
  id: string
  name: string
  email: string
  categories: string[]
  contributor_type: string
  team_name: string
  total_points: number
}

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

const CATEGORIES = ['technical', 'design', 'community', 'research', 'operations']
const COMPLEXITIES = ['small', 'medium', 'large']

const DEADLINE_DAYS: Record<string, number> = {
  small: 3, medium: 6, large: 12,
}

const POINT_RANGES: Record<string, Record<string, [number, number]>> = {
  technical:  { small: [50, 120],  medium: [150, 280], large: [300, 500] },
  design:     { small: [30, 80],   medium: [80, 160],  large: [180, 300] },
  research:   { small: [50, 100],  medium: [100, 200], large: [200, 400] },
  operations: { small: [30, 60],   medium: [80, 150],  large: [150, 200] },
  community:  { small: [10, 30],   medium: [60, 120],  large: [100, 150] },
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function CreateTaskContent() {
  const router = useRouter()
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(false)
  const [createMode, setCreateMode] = useState<'open' | 'direct'>('open')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'technical',
    complexity: 'medium',
    assignedTo: '',
    startDate: '',
    deadlineDate: '',
  })

  useEffect(() => {
    async function fetchContributors() {
      const supabase = createClient()
      const { data } = await supabase
        .from('contributors')
        .select('id, name, email, categories, contributor_type, team_name, total_points')
        .eq('status', 'active')
        .order('name', { ascending: true })
      if (data) setContributors(data)
    }
    fetchContributors()
  }, [])

  const isValid = form.title.trim() && form.description.trim() &&
    (createMode === 'open' || (form.assignedTo && form.startDate && form.deadlineDate))

  async function handleCreate() {
    if (!isValid) return
    setLoading(true)
    const supabase = createClient()

    const range = POINT_RANGES[form.category]?.[form.complexity]
    const deadlineDays = DEADLINE_DAYS[form.complexity]

    let insertData: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description,
      category: form.category,
      complexity: form.complexity,
      point_range_min: range?.[0] ?? 50,
      point_range_max: range?.[1] ?? 200,
      deadline_days: deadlineDays,
      status: 'open',
    }

    if (createMode === 'direct') {
      insertData = {
        ...insertData,
        status: 'assigned',
        assigned_to: form.assignedTo,
        claimed_at: new Date(form.startDate).toISOString(),
        deadline_at: new Date(form.deadlineDate).toISOString(),
      }
    }

    const { error } = await supabase.from('tasks').insert(insertData)

    if (!error) {
      if (createMode === 'direct') {
        const assignedContributor = contributors.find(c => c.id === form.assignedTo)
        if (assignedContributor) {
          const displayName = assignedContributor.contributor_type === 'team' && assignedContributor.team_name
            ? assignedContributor.team_name
            : assignedContributor.name

          const startDateStr = new Date(form.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          const deadlineDateStr = new Date(form.deadlineDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: assignedContributor.email,
              name: displayName,
              subject: `You have been assigned a task — ${form.title}`,
              htmlContent: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0D0B14;padding:40px 32px;border-radius:16px;">
                  <h1 style="font-size:22px;font-weight:600;color:#E8E6F0;margin:0 0 12px;letter-spacing:-0.02em;">
                    Task assigned to you
                  </h1>
                  <p style="font-size:15px;color:#7B6FA8;line-height:1.7;margin:0 0 24px;">
                    Hi ${esc(displayName)}, the Zivana core team has assigned a task directly to you.
                  </p>
                  <div style="background:#13101E;border:1px solid #1C1730;border-radius:12px;padding:20px;margin:0 0 24px;">
                    <p style="font-size:16px;font-weight:600;color:#E8E6F0;margin:0 0 12px;">${esc(form.title)}</p>
                    <p style="font-size:13px;color:#7B6FA8;margin:0 0 8px;">Category: <span style="color:#A78BFA;text-transform:capitalize;">${esc(form.category)}</span></p>
                    <p style="font-size:13px;color:#7B6FA8;margin:0 0 8px;">Complexity: <span style="color:#A78BFA;text-transform:capitalize;">${esc(form.complexity)}</span></p>
                    <p style="font-size:13px;color:#7B6FA8;margin:0 0 8px;">Start date: <span style="color:#E8E6F0;">${esc(startDateStr)}</span></p>
                    <p style="font-size:13px;color:#7B6FA8;margin:0;">Deadline: <span style="color:#E8E6F0;">${esc(deadlineDateStr)}</span></p>
                  </div>
                  <p style="font-size:15px;color:#7B6FA8;line-height:1.7;margin:0 0 32px;">
                    Log in to your dashboard to view the full task description and submit your work when complete.
                  </p>
                  <a href="https://zivana.network/contribute/dashboard"
                    style="display:inline-block;background:linear-gradient(135deg,#A78BFA,#6D28D9,#4C1D95);color:white;padding:14px 28px;border-radius:9999px;font-size:14px;font-weight:500;text-decoration:none;">
                    Go to your dashboard
                  </a>
                  <div style="margin-top:32px;padding-top:24px;border-top:1px solid #1C1730;">
                    <p style="font-size:11px;color:#2D2450;margin:0;">Zivana Network — zivana.network</p>
                  </div>
                </div>
              `,
            }),
          })
        }
      }

      router.push('/admin/dashboard/tasks')
    }

    setLoading(false)
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

  const selectedContributor = contributors.find(c => c.id === form.assignedTo)

  return (
    <div className="min-h-screen bg-void pb-20">
      {/* Sticky header */}
      <div
        className="sticky top-0 z-30 px-8 lg:px-12 pt-8 pb-4"
        style={{ background: '#0D0B14', borderBottom: '1px solid #1C1730' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/admin/dashboard/tasks"
            style={{ color: '#6B5FA0', textDecoration: 'none', fontFamily: 'Switzer, sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Tasks
          </Link>
          <span style={{ color: '#2D2450' }}>/</span>
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>New task</span>
        </div>
        <h1 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(24px,4vw,36px)', letterSpacing: '-0.025em', color: '#E8E6F0', lineHeight: 1.1, margin: '8px 0 0' }}>
          Create new task
        </h1>
      </div>

      <div className="px-8 lg:px-12 pt-8 max-w-2xl">
        <div className="flex flex-col gap-6">

          {/* Mode toggle */}
          <div>
            <label style={labelStyle}>Task type</label>
            <div className="flex gap-2 p-1 rounded-xl" style={{ background: '#13101E', border: '1px solid #1C1730' }}>
              {(['open', 'direct'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCreateMode(mode)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: createMode === mode ? 'rgba(109,40,217,0.2)' : 'transparent',
                    color: createMode === mode ? '#A78BFA' : '#8B7EC8',
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: 13,
                    fontWeight: createMode === mode ? 500 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {mode === 'open' ? 'Open task' : 'Direct assignment'}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#6B5FA0', lineHeight: 1.6, marginTop: 8 }}>
              {createMode === 'open'
                ? 'Task will appear on the open board. Any active contributor can claim it.'
                : 'Task is assigned directly to a contributor. It will not appear on the open board. Use this for work already in progress or pre-agreed assignments.'
              }
            </p>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be built or done?"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
              onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => setForm({ ...form, description: html })}
              placeholder="Describe the task in detail. Include what good looks like."
            />
          </div>

          {/* Category and Complexity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={inputStyle}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Complexity</label>
              <select
                value={form.complexity}
                onChange={(e) => setForm({ ...form, complexity: e.target.value })}
                style={inputStyle}
              >
                {COMPLEXITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Point range info */}
          <div className="p-4 rounded-xl" style={{ background: '#13101E', border: '1px solid #1C1730' }}>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
              Point range: <span style={{ color: '#A78BFA', fontWeight: 600 }}>
                {POINT_RANGES[form.category]?.[form.complexity]?.[0]}–{POINT_RANGES[form.category]?.[form.complexity]?.[1]} pts
              </span>
              {createMode === 'open' && (
                <> · Deadline: <span style={{ color: '#A78BFA', fontWeight: 600 }}>{DEADLINE_DAYS[form.complexity]} days from claim</span></>
              )}
            </p>
          </div>

          {/* Direct assignment fields */}
          {createMode === 'direct' && (
            <>
              <div>
                <label style={labelStyle}>Assign to contributor</label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select a contributor...</option>
                  {contributors.map((c) => {
                    const displayName = c.contributor_type === 'team' && c.team_name ? c.team_name : c.name
                    const cats = c.categories?.join(', ') ?? ''
                    return (
                      <option key={c.id} value={c.id}>
                        {displayName} — {c.email} · {cats} · {c.total_points} pts
                      </option>
                    )
                  })}
                </select>
              </div>

              {selectedContributor && (() => {
                const displayName = selectedContributor.contributor_type === 'team' && selectedContributor.team_name
                  ? selectedContributor.team_name
                  : selectedContributor.name
                return (
                  <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(109,40,217,0.06)', border: '1px solid rgba(109,40,217,0.15)' }}>
                    <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 36, height: 36, background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.25)' }}>
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
                        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8' }}>{selectedContributor.total_points} pts</span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Start date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Deadline date</label>
                  <input
                    type="date"
                    value={form.deadlineDate}
                    onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={loading || !isValid}
              className="btn-primary"
              style={{ fontSize: 13, opacity: loading || !isValid ? 0.5 : 1 }}
            >
              {loading ? 'Creating...' : createMode === 'direct' ? 'Assign task' : 'Create task'}
            </button>
            <Link
              href="/admin/dashboard/tasks"
              className="btn-outline"
              style={{ fontSize: 13 }}
            >
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function CreateTaskPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <CreateTaskContent />
    </Suspense>
  )
}