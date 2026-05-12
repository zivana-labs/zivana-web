'use client'

import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createPublicClient } from '@/lib/supabase/public'

type Task = {
  id: string
  title: string
  description: string
  category: string
  complexity: string
  point_range_min: number
  point_range_max: number
  status: string
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

const COMPLEXITY_ORDER: Record<string, number> = {
  small: 1, medium: 2, large: 3,
}

function PortalTasksContent() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [complexity, setComplexity] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [claimTask, setClaimTask] = useState<Task | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [activeClaimCount, setActiveClaimCount] = useState(0)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const publicClient = createPublicClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('contributors')
          .select('id, name, max_claims')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        if (data) {
          setContributor(data)

          const { count } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', data.id)
            .eq('status', 'assigned')

          setActiveClaimCount(count ?? 0)
        }
      }

      const { data: taskData } = await publicClient
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (taskData) setTasks(taskData)
      setLoading(false)
    }
    load()
  }, [])

  async function handleClaim() {
    if (!claimTask || !contributor) return
    setClaiming(true)
    setClaimError('')

    const supabase = createClient()
    const now = new Date()
    const deadlineDays = claimTask.complexity === 'small' ? 3 : claimTask.complexity === 'medium' ? 6 : 12
    const deadlineAt = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000)

    const { data, error } = await supabase
      .from('tasks')
      .update({
        status: 'assigned',
        assigned_to: contributor.id,
        claimed_at: now.toISOString(),
        deadline_at: deadlineAt.toISOString(),
        deadline_days: deadlineDays,
      })
      .eq('id', claimTask.id)
      .eq('status', 'open')
      .select()

    if (error) {
      setClaimError('Failed to claim task. Please try again.')
      setClaiming(false)
      return
    }

    if (!data || data.length === 0) {
      setClaimError('This task was just claimed by someone else. Please choose another.')
      setClaiming(false)
      return
    }

    setTasks(prev => prev.filter(t => t.id !== claimTask.id))
    setClaimed(true)
    setClaiming(false)
    setActiveClaimCount(prev => prev + 1)
  }

  const filtered = tasks.filter((t) => {
    const matchCat = category === 'all' || t.category === category
    const matchCom = complexity === 'all' || t.complexity === complexity
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchCom && matchSearch
  })

  const categories = ['all', 'technical', 'design', 'community', 'research', 'operations']
  const complexities = ['all', 'small', 'medium', 'large']

  const inputStyle = {
    padding: '10px 14px',
    background: '#13101E',
    border: '1px solid #1C1730',
    borderRadius: 10,
    color: '#E8E6F0',
    fontFamily: 'Switzer, sans-serif',
    fontSize: 14,
    outline: 'none',
  }

  return (
    <div className="min-h-screen bg-void pt-8 pb-20 px-8 lg:px-12">

      {/* Header */}
      <div className="mb-10">
        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B7EC8' }}>
          Contributor Portal
        </span>
        <h1
          className="mt-2 mb-3"
          style={{
            fontFamily: 'Cabinet Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(24px,4vw,40px)',
            letterSpacing: '-0.025em',
            color: '#E8E6F0',
            lineHeight: 1.1,
          }}
        >
          Open tasks
        </h1>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', maxWidth: 480, lineHeight: 1.75 }}>
          Browse available work and claim tasks that match your skills. Claimed tasks appear in your contributions for core team verification.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-8">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: 400, width: '100%' }}
          onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
          onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: `1px solid ${category === c ? (CATEGORY_COLOURS[c] ?? '#6D28D9') : '#1C1730'}`,
                background: category === c ? (CATEGORY_COLOURS[c] ?? '#6D28D9') + '18' : 'transparent',
                color: category === c ? (CATEGORY_COLOURS[c] ?? '#A78BFA') : '#8B7EC8',
                fontFamily: 'Switzer, sans-serif',
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {complexities.map((c) => (
            <button
              key={c}
              onClick={() => setComplexity(c)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: `1px solid ${complexity === c ? '#6D28D9' : '#1C1730'}`,
                background: complexity === c ? 'rgba(109,40,217,0.15)' : 'transparent',
                color: complexity === c ? '#A78BFA' : '#8B7EC8',
                fontFamily: 'Switzer, sans-serif',
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
          {loading ? 'Loading...' : `${filtered.length} task${filtered.length !== 1 ? 's' : ''} available`}
        </span>
      </div>

      {/* Tasks grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730', height: 200, opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
          <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0', marginBottom: 6 }}>No tasks found</p>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#8B7EC8' }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered
            .sort((a, b) => COMPLEXITY_ORDER[b.complexity] - COMPLEXITY_ORDER[a.complexity])
            .map((task) => {
              const color = CATEGORY_COLOURS[task.category] ?? '#A78BFA'
              return (
                <div
                  key={task.id}
                  className="flex flex-col gap-4 p-6 rounded-2xl border"
                  style={{ background: '#13101E', borderColor: '#1C1730', transition: 'border-color 0.3s, transform 0.3s' }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = color + '50'
                    el.style.transform = 'translateY(-3px)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = '#1C1730'
                    el.style.transform = 'translateY(0)'
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: color + '18', color, border: `1px solid ${color}35`, fontFamily: 'Switzer, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {task.category}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: '#1E1640', color: '#6B5FA0', fontFamily: 'Switzer, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {task.complexity}
                    </span>
                  </div>

                  <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0', lineHeight: 1.3, flex: 1 }}>
                    {task.title}
                  </p>

                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12.5, color: '#7B6FA8', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #1C1730' }}>
                    <div className="flex flex-col gap-0.5">
                      <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B7EC8' }}>Points</span>
                      <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color }}>
                        {task.point_range_min}–{task.point_range_max}
                      </span>
                    </div>
                    {(() => {
                      const maxReached = contributor !== null && activeClaimCount >= (contributor.max_claims ?? 2)
                      return (
                        <button
                          onClick={() => {
                            if (maxReached) return
                            setClaimTask(task)
                            setClaimed(false)
                            setClaimError('')
                          }}
                          disabled={maxReached}
                          className="btn-primary"
                          style={{
                            fontSize: 11,
                            padding: '8px 16px',
                            opacity: maxReached ? 0.4 : 1,
                            cursor: maxReached ? 'not-allowed' : 'pointer',
                          }}
                          title={maxReached ? 'You have reached your 2 task limit. Complete or unclaim a task first.' : ''}
                        >
                          {maxReached ? 'Limit reached' : 'Claim task'}
                        </button>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Claim modal */}
      {claimTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,11,20,0.92)', backdropFilter: 'blur(16px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setClaimTask(null); setClaimed(false) } }}
        >
          <div className="w-full max-w-md rounded-2xl border p-8" style={{ background: '#13101E', borderColor: '#1C1730' }}>
            {claimed ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(15,118,110,0.12)', border: '1px solid rgba(15,118,110,0.25)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 12l6 6L20 6" />
                  </svg>
                </div>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 20, color: '#E8E6F0' }}>Task claimed</p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.7 }}>
                  You have claimed <span style={{ color: '#A78BFA' }}>{claimTask.title}</span>. Complete the work and submit your contribution from the Overview tab.
                </p>
                <button onClick={() => { setClaimTask(null); setClaimed(false) }} className="btn-primary" style={{ fontSize: 13 }}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: '#E8E6F0' }}>Claim task</p>
                  <button onClick={() => setClaimTask(null)} style={{ color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button>
                </div>

                <div className="flex flex-col gap-4 p-5 rounded-xl border mb-6" style={{ background: '#0F0D1A', borderColor: '#1E1640' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ padding: '2px 8px', borderRadius: 20, background: (CATEGORY_COLOURS[claimTask.category] ?? '#A78BFA') + '18', color: CATEGORY_COLOURS[claimTask.category] ?? '#A78BFA', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {claimTask.category}
                    </span>
                    <span style={{ padding: '2px 8px', borderRadius: 20, background: '#1E1640', color: '#6B5FA0', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {claimTask.complexity}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>{claimTask.title}</p>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.65 }}>{claimTask.description}</p>
                  <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: CATEGORY_COLOURS[claimTask.category] ?? '#A78BFA' }}>
                    {claimTask.point_range_min}–{claimTask.point_range_max} pts
                  </p>
                </div>

                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.65, marginBottom: 20 }}>
                  Claiming this task marks it as assigned to you. Complete the work and submit your contribution from the Overview tab for core team verification.
                </p>

                {claimError && (
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#FCA5A5', marginBottom: 16 }}>{claimError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="btn-primary flex-1 justify-center"
                    style={{ opacity: claiming ? 0.7 : 1 }}
                  >
                    {claiming ? 'Claiming...' : 'Confirm claim'}
                  </button>
                  <button onClick={() => setClaimTask(null)} className="btn-outline" style={{ fontSize: 13 }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default function PortalTasksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <PortalTasksContent />
    </Suspense>
  )
}