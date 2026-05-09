'use client'

import { useEffect, useState, Suspense } from 'react'
import { createPublicClient } from '@/lib/supabase/public'

type Contributor = {
  id: string
  name: string
  categories: string[]
  location: string
  contributor_type: string
  team_name: string
  total_points: number
  verified_contributions: number
  status: string
}

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

const MEDALS = ['🥇', '🥈', '🥉']

function PortalLeaderboardContent() {
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')

  useEffect(() => {
    async function fetch() {
      const supabase = createPublicClient()
      const { data, error } = await supabase
        .from('contributors')
        .select('*')
        .eq('status', 'active')
        .order('total_points', { ascending: false })

      if (!error && data) setContributors(data)
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = contributors.filter((c) =>
    category === 'all' || c.categories?.includes(category)
  )

  const categories = ['all', 'technical', 'design', 'community', 'research', 'operations']
  const totalPoints = contributors.reduce((sum, c) => sum + c.total_points, 0)
  const totalContributions = contributors.reduce((sum, c) => sum + c.verified_contributions, 0)

  return (
    <div className="min-h-screen bg-void pt-8 pb-20 px-8 lg:px-12">

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
          Leaderboard
        </h1>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', maxWidth: 480, lineHeight: 1.75 }}>
          A public record of every verified contribution to the Zivana Protocol.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Active contributors', value: contributors.length },
          { label: 'Total points earned', value: totalPoints.toLocaleString() },
          { label: 'Verified contributions', value: totalContributions },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-2 p-5 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 24, letterSpacing: '-0.02em', color: '#A78BFA', lineHeight: 1 }}>
              {loading ? '—' : s.value}
            </span>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
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

      {/* List */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730', height: 72, opacity: 0.5 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
          <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0', marginBottom: 6 }}>No contributors yet</p>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#8B7EC8' }}>Be the first to contribute in this category</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c, i) => {
            const color = CATEGORY_COLOURS[c.categories?.[0]] ?? '#A78BFA'
            const isTop3 = i < 3
            const maxPoints = filtered[0]?.total_points ?? 1
            const barWidth = maxPoints > 0 ? Math.max(4, (c.total_points / maxPoints) * 100) : 4

            return (
              <div
                key={c.id}
                className="relative flex items-center gap-5 p-5 rounded-2xl border overflow-hidden"
                style={{
                  background: isTop3 ? 'linear-gradient(135deg,#13101E,#160F2A)' : '#13101E',
                  borderColor: isTop3 ? color + '30' : '#1C1730',
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barWidth}%`, background: `linear-gradient(90deg,${color}08,transparent)`, pointerEvents: 'none' }} />

                <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 36 }}>
                  {isTop3
                    ? <span style={{ fontSize: 20 }}>{MEDALS[i]}</span>
                    : <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#6B5FA0' }}>{i + 1}</span>
                  }
                </div>

                <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 40, height: 40, background: color + '18', border: `1px solid ${color}35` }}>
                  <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color }}>{c.name.charAt(0).toUpperCase()}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#E8E6F0' }}>
                      {c.contributor_type === 'team' && c.team_name ? c.team_name : c.name}
                    </span>
                    {c.categories?.map((cat) => {
                      const catColor = CATEGORY_COLOURS[cat] ?? '#A78BFA'
                      return (
                        <span key={cat} style={{ padding: '2px 8px', borderRadius: 20, background: catColor + '15', color: catColor, border: `1px solid ${catColor}30`, fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {cat}
                        </span>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-4">
                    {c.location && <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8' }}>{c.location}</span>}
                    <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8' }}>{c.verified_contributions} contribution{c.verified_contributions !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 20, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                    {c.total_points.toLocaleString()}
                  </div>
                  <div style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: '#8B7EC8', marginTop: 2 }}>points</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PortalLeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <PortalLeaderboardContent />
    </Suspense>
  )
}