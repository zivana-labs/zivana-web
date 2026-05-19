'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
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
}

type Contribution = {
  id: string
  title: string
  category: string
  complexity: string
  final_points: number
  verified_at: string
  evidence_url: string | null
}

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

function ContributorProfileContent() {
  const params = useParams()
  const contributorId = params.id as string

  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createPublicClient()

      const { data: contributorData, error } = await supabase
        .from('contributors')
        .select('id, name, categories, location, contributor_type, team_name, total_points, verified_contributions')
        .eq('id', contributorId)
        .eq('status', 'active')
        .single()

      if (error || !contributorData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setContributor(contributorData)

      const { data: contributionData } = await supabase
        .from('contributions')
        .select('id, title, category, complexity, final_points, verified_at, evidence_url')
        .eq('contributor_id', contributorId)
        .eq('status', 'verified')
        .order('verified_at', { ascending: false })

      if (contributionData) setContributions(contributionData)
      setLoading(false)
    }
    load()
  }, [contributorId])

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-void pt-36 pb-28 flex flex-col items-center justify-center px-8">
        <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 24, color: '#E8E6F0', marginBottom: 12 }}>
          Contributor not found
        </p>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#7B6FA8', marginBottom: 28 }}>
          This profile does not exist or is not publicly available.
        </p>
        <Link href="/contribute/leaderboard" className="btn-primary" style={{ fontSize: 13 }}>
          View leaderboard
        </Link>
      </div>
    )
  }

  const displayName = contributor!.contributor_type === 'team' && contributor!.team_name
    ? contributor!.team_name
    : contributor!.name

  const color = CATEGORY_COLOURS[contributor!.categories?.[0]] ?? '#A78BFA'

  return (
    <div className="bg-void min-h-screen pt-36 pb-28">
      <div className="max-w-3xl mx-auto px-8 lg:px-14">

        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-10">
          <Link
            href="/contribute/leaderboard"
            style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 2L4 7l5 5" />
            </svg>
            Leaderboard
          </Link>
          <span style={{ color: '#2D2450' }}>/</span>
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#6B5FA0' }}>{displayName}</span>
        </div>

        {/* Profile header */}
        <div className="flex items-start gap-6 mb-10">
          <div className="flex-shrink-0 flex items-center justify-center rounded-full" style={{ width: 72, height: 72, background: color + '18', border: `2px solid ${color}35` }}>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, color }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(22px,3vw,32px)', letterSpacing: '-0.02em', color: '#E8E6F0', lineHeight: 1.2 }}>
                {displayName}
              </h1>
              {contributor!.contributor_type === 'team' && (
                <span style={{ padding: '2px 10px', borderRadius: 20, background: '#1E1640', color: '#6B5FA0', fontFamily: 'Switzer, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Team
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {contributor!.categories?.map(cat => {
                const catColor = CATEGORY_COLOURS[cat] ?? '#A78BFA'
                return (
                  <span key={cat} style={{ padding: '2px 10px', borderRadius: 20, background: catColor + '15', color: catColor, border: `1px solid ${catColor}30`, fontFamily: 'Switzer, sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {cat}
                  </span>
                )
              })}
              {contributor!.location && (
                <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8' }}>
                  {contributor!.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="flex flex-col gap-2 p-6 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 32, letterSpacing: '-0.02em', color, lineHeight: 1 }}>
              {contributor!.total_points.toLocaleString()}
            </span>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8' }}>Total points</span>
          </div>
          <div className="flex flex-col gap-2 p-6 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 32, letterSpacing: '-0.02em', color: '#A78BFA', lineHeight: 1 }}>
              {contributor!.verified_contributions}
            </span>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8' }}>Verified contributions</span>
          </div>
        </div>

        {/* Verified contributions list */}
        <div>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 20, letterSpacing: '-0.02em', color: '#E8E6F0', marginBottom: 16 }}>
            Verified contributions
          </h2>

          {contributions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#8B7EC8' }}>No verified contributions yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {contributions.map(contrib => {
                const catColor = CATEGORY_COLOURS[contrib.category] ?? '#A78BFA'
                return (
                  <div key={contrib.id} className="flex items-center gap-4 p-5 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#E8E6F0', marginBottom: 6 }}>
                        {contrib.title}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: catColor + '15', color: catColor, fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {contrib.category}
                        </span>
                        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', textTransform: 'capitalize' }}>
                          {contrib.complexity}
                        </span>
                        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0' }}>
                          {new Date(contrib.verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {contrib.evidence_url && (
                          <a
                            href={contrib.evidence_url.startsWith('http://') || contrib.evidence_url.startsWith('https://') ? contrib.evidence_url : `https://${contrib.evidence_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                            style={{ textDecoration: 'none' }}
                          >
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M3.5 1.5H1.5v8h8V7.5M6.5 1.5h3v3M5 6l4.5-4.5" />
                            </svg>
                            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#A78BFA' }}>
                              View evidence
                            </span>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: catColor, lineHeight: 1 }}>
                        {contrib.final_points}
                      </div>
                      <div style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: '#8B7EC8', marginTop: 2 }}>pts</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Share CTA */}
        <div className="mt-10 p-6 rounded-2xl border text-center" style={{ background: '#0F0D1A', borderColor: '#1E1640' }}>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.7, marginBottom: 12 }}>
            This is a verifiable public record of contributions to Zivana Protocol. Share this URL as proof of work.
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#A78BFA', background: 'none', border: '1px solid rgba(109,40,217,0.3)', padding: '8px 16px', borderRadius: 9999, cursor: 'pointer' }}
          >
            Copy profile URL
          </button>
        </div>

      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default function ContributorProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <ContributorProfileContent />
    </Suspense>
  )
}