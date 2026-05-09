'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [complexity, setComplexity] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchTasks() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (!error && data) setTasks(data)
      setLoading(false)
    }
    fetchTasks()
  }, [])

  const filtered = tasks.filter((t) => {
    const matchCat = category === 'all' || t.category === category
    const matchCom = complexity === 'all' || t.complexity === complexity
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchCom && matchSearch
  })

  const categories = ['all', 'technical', 'design', 'community', 'research', 'operations']
  const complexities = ['all', 'small', 'medium', 'large']

  return (
    <div className="bg-void min-h-screen pt-36 pb-28">
      <div className="max-w-6xl mx-auto px-8 lg:px-14">

        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-3">
            <Link
              href="/contribute"
              style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8', textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#7B6FA8')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8B7EC8')}
            >
              Contribute
            </Link>
            <span style={{ color: '#6B5FA0' }}>/</span>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#7B6FA8' }}>Tasks</span>
          </div>
          <h1
            className="mb-4"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(32px,5vw,64px)',
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              color: '#E8E6F0',
            }}
          >
            Open tasks
          </h1>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 16, color: '#7B6FA8', maxWidth: 480, lineHeight: 1.75 }}>
            Browse available work across all five contribution categories. Each task shows the point range before you start.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-10">
          {/* Search */}
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '11px 16px',
              background: '#13101E',
              border: '1px solid #1C1730',
              borderRadius: 10,
              color: '#E8E6F0',
              fontFamily: 'Switzer, sans-serif',
              fontSize: 14,
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
            onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
          />

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '6px 16px',
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

          {/* Complexity filter */}
          <div className="flex flex-wrap gap-2">
            {complexities.map((c) => (
              <button
                key={c}
                onClick={() => setComplexity(c)}
                style={{
                  padding: '5px 14px',
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

        {/* Results count */}
        <div className="mb-6">
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
            {loading ? 'Loading tasks...' : `${filtered.length} task${filtered.length !== 1 ? 's' : ''} available`}
          </span>
        </div>

        {/* Tasks grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border p-6"
                style={{
                  background: '#13101E',
                  borderColor: '#1C1730',
                  height: 200,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 rounded-2xl border"
            style={{ background: '#13101E', borderColor: '#1C1730' }}
          >
            <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: '#E8E6F0', marginBottom: 8 }}>
              No tasks found
            </p>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#8B7EC8' }}>
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered
              .sort((a, b) => COMPLEXITY_ORDER[b.complexity] - COMPLEXITY_ORDER[a.complexity])
              .map((task, i) => {
                const color = CATEGORY_COLOURS[task.category] ?? '#A78BFA'
                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-4 p-6 rounded-2xl border"
                    style={{
                      background: '#13101E',
                      borderColor: '#1C1730',
                      transition: 'border-color 0.3s, transform 0.3s',
                      opacity: 0,
                      animation: `fadeUp 0.5s ease forwards ${i * 60}ms`,
                    }}
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
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: color + '18',
                          color: color,
                          border: `1px solid ${color}35`,
                          fontFamily: 'Switzer, sans-serif',
                          fontSize: 9,
                          fontWeight: 500,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {task.category}
                      </span>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: '#1E1640',
                          color: '#6B5FA0',
                          fontFamily: 'Switzer, sans-serif',
                          fontSize: 9,
                          fontWeight: 500,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {task.complexity}
                      </span>
                    </div>

                    {/* Title */}
                    <p
                      style={{
                        fontFamily: 'Cabinet Grotesk, sans-serif',
                        fontWeight: 600,
                        fontSize: 15,
                        color: '#E8E6F0',
                        lineHeight: 1.3,
                        flex: 1,
                      }}
                    >
                      {task.title}
                    </p>

                    {/* Description */}
                    <p
                      style={{
                        fontFamily: 'Switzer, sans-serif',
                        fontWeight: 300,
                        fontSize: 12.5,
                        color: '#7B6FA8',
                        lineHeight: 1.65,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {task.description}
                    </p>

                    {/* Footer */}
                    <div
                      className="flex items-center justify-between pt-4"
                      style={{ borderTop: '1px solid #1C1730' }}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B7EC8' }}>
                          Points
                        </span>
                        <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: color }}>
                          {task.point_range_min}–{task.point_range_max}
                        </span>
                      </div>
                      <Link
                        href="/contribute"
                        className="btn-primary"
                        style={{ fontSize: 11, padding: '8px 16px' }}
                      >
                        Claim task
                      </Link>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}