'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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

type Task = {
  id: string
  title: string
  description: string
  category: string
  complexity: string
  point_range_min: number
  point_range_max: number
  status: string
  deadline_days: number
  assigned_to: string | null
  claimed_at: string | null
  deadline_at: string | null
  created_at: string
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
const STATUS_OPTIONS = ['all', 'open', 'assigned', 'completed']

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

function TasksContent() {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get('filter') ?? 'all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Task | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 6

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'technical',
    complexity: 'medium',
  })


  async function fetchTasks() {
    const supabase = createClient()
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query
    if (data) setTasks(data)
    setLoading(false)
  }

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
    fetchTasks()
    fetchContributors()
  }, [filter])

  useEffect(() => {
    if (selected) {
      setEditForm({
        title: selected.title,
        description: selected.description,
        category: selected.category,
        complexity: selected.complexity,
      })
    }
  }, [selected])

  useEffect(() => {
    setPage(1)
  }, [filter, search])

  async function handleUpdate() {
    if (!selected) return
    setActionLoading(true)
    const supabase = createClient()

    const range = POINT_RANGES[editForm.category]?.[editForm.complexity]

    const { error } = await supabase
      .from('tasks')
      .update({
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        complexity: editForm.complexity,
        point_range_min: range?.[0] ?? selected.point_range_min,
        point_range_max: range?.[1] ?? selected.point_range_max,
        deadline_days: DEADLINE_DAYS[editForm.complexity],
      })
      .eq('id', selected.id)

    if (!error) {
      setActionSuccess('Task updated successfully')
      setSelected(null)
      await fetchTasks()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(false)
  }

  async function handleDelete(taskId: string) {
    if (!window.confirm('Are you sure you want to delete this task? This cannot be undone.')) return
    setActionLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      setActionSuccess('Task deleted')
      setSelected(null)
      await fetchTasks()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(false)
  }


  async function handleUnassign(taskId: string) {
    setActionLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('tasks')
      .update({ status: 'open', assigned_to: null, claimed_at: null, deadline_at: null })
      .eq('id', taskId)

    if (!error) {
      setActionSuccess('Task unassigned successfully')
      setSelected(null)
      await fetchTasks()
      setTimeout(() => setActionSuccess(''), 3000)
    }
    setActionLoading(false)
  }

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

  const statusColor: Record<string, string> = {
    open: '#5EEAD4',
    assigned: '#FCD34D',
    completed: '#A78BFA',
  }

  const statusBg: Record<string, string> = {
    open: 'rgba(15,118,110,0.12)',
    assigned: 'rgba(234,179,8,0.12)',
    completed: 'rgba(109,40,217,0.12)',
  }


  return (
    <div className="min-h-screen bg-void pb-20">
      {/* Sticky header and filters */}
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
              Tasks
            </h1>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.75 }}>
              Create, edit, and manage the contributor task board.
            </p>
          </div>
          <Link
            href="/admin/dashboard/tasks/new"
            className="btn-primary"
            style={{ fontSize: 13, alignSelf: 'flex-start', textDecoration: 'none' }}
          >
            + New task
          </Link>
        </div>

        {actionSuccess && (
          <div className="flex items-center gap-3 p-4 rounded-xl border mb-4" style={{ background: 'rgba(15,118,110,0.1)', borderColor: 'rgba(15,118,110,0.25)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 8l4 4L14 3" />
            </svg>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#5EEAD4' }}>{actionSuccess}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, background: '#13101E', maxWidth: 400 }}
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

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730', height: 80, opacity: 0.5 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
            <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0', marginBottom: 6 }}>No tasks found</p>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>Try adjusting your filters or create a new task</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginated.map((task) => {
              const catColor = CATEGORY_COLOURS[task.category] ?? '#A78BFA'
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-5 rounded-2xl border cursor-pointer"
                  style={{
                    background: selected?.id === task.id ? 'rgba(109,40,217,0.06)' : '#13101E',
                    borderColor: selected?.id === task.id ? 'rgba(109,40,217,0.3)' : '#1C1730',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelected(selected?.id === task.id ? null : task)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#E8E6F0' }}>
                        {task.title}
                      </span>
                      <span style={{ padding: '1px 8px', borderRadius: 20, background: catColor + '15', color: catColor, border: `1px solid ${catColor}25`, fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {task.category}
                      </span>
                      <span style={{ padding: '1px 8px', borderRadius: 20, background: '#1E1640', color: '#6B5FA0', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {task.complexity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>
                        {task.point_range_min}–{task.point_range_max} pts
                      </span>
                      <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>
                        {task.deadline_days} day deadline
                      </span>
                    </div>
                  </div>

                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: statusBg[task.status] ?? 'rgba(255,255,255,0.05)',
                    color: statusColor[task.status] ?? '#8B7EC8',
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: 9,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}>
                    {task.status}
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
              style={{ padding: '8px 18px', borderRadius: 9999, border: '1px solid #1C1730', background: 'transparent', color: page === 1 ? '#2D2450' : '#8B7EC8', fontFamily: 'Switzer, sans-serif', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              Previous
            </button>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ padding: '8px 18px', borderRadius: 9999, border: '1px solid #1C1730', background: 'transparent', color: page === totalPages ? '#2D2450' : '#8B7EC8', fontFamily: 'Switzer, sans-serif', fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
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
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#1C1730' }}>
              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0' }}>Edit task</p>
              <button onClick={() => setSelected(null)} style={{ color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                  onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <RichTextEditor
                  value={editForm.description}
                  onChange={(html) => setEditForm({ ...editForm, description: html })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={inputStyle}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Complexity</label>
                  <select
                    value={editForm.complexity}
                    onChange={(e) => setEditForm({ ...editForm, complexity: e.target.value })}
                    style={inputStyle}
                  >
                    {COMPLEXITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: '#0D0B14', border: '1px solid #1C1730' }}>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8' }}>
                  Point range: <span style={{ color: '#A78BFA', fontWeight: 600 }}>
                    {POINT_RANGES[editForm.category]?.[editForm.complexity]?.[0]}–{POINT_RANGES[editForm.category]?.[editForm.complexity]?.[1]} pts
                  </span>
                  {' '}· Deadline: <span style={{ color: '#A78BFA', fontWeight: 600 }}>{DEADLINE_DAYS[editForm.complexity]} days</span>
                </p>
              </div>
            </div>

            <div className="p-6 border-t flex flex-wrap gap-3" style={{ borderColor: '#1C1730' }}>
              <button onClick={handleUpdate} disabled={actionLoading} className="btn-primary" style={{ fontSize: 13, opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? 'Saving...' : 'Save changes'}
              </button>
              {selected.status === 'assigned' && (
                <button
                  onClick={() => handleUnassign(selected.id)}
                  disabled={actionLoading}
                  style={{ fontSize: 13, padding: '10px 20px', borderRadius: 9999, border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.08)', color: '#FCD34D', fontFamily: 'Switzer, sans-serif', cursor: 'pointer', opacity: actionLoading ? 0.7 : 1 }}
                >
                  Unassign task
                </button>
              )}
              <button
                onClick={() => handleDelete(selected.id)}
                disabled={actionLoading}
                style={{ fontSize: 13, padding: '10px 20px', borderRadius: 9999, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#FCA5A5', fontFamily: 'Switzer, sans-serif', cursor: 'pointer', opacity: actionLoading ? 0.7 : 1, marginLeft: 'auto' }}
              >
                {actionLoading ? 'Deleting...' : 'Delete task'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function AdminTasksPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <TasksContent />
    </Suspense>
  )
}