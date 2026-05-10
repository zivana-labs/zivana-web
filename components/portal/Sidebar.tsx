'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/logo/Logo'
import { createClient } from '@/lib/supabase/client'

type Contributor = {
  name: string
  categories: string[]
  total_points: number
  verified_contributions: number
  contributor_type: string
  team_name: string
}

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/contribute/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Tasks',
    href: '/contribute/dashboard/tasks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="1" width="14" height="14" rx="2" />
        <path d="M4 5h8M4 8h6M4 11h4" />
      </svg>
    ),
  },
  {
    label: 'Contributions',
    href: '/contribute/dashboard?tab=contributions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 1v14M1 8h14" />
      </svg>
    ),
  },
  {
    label: 'Leaderboard',
    href: '/contribute/dashboard/leaderboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M1 12h3V6H1zM6 12h3V3H6zM11 12h3V8h-3z" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/contribute/dashboard?tab=profile',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="5" r="3" />
        <path d="M1 14c0-3.314 3.134-6 7-6s7 2.686 7 6" />
      </svg>
    ),
  },
]

function SidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('contributors')
        .select('name, categories, total_points, verified_contributions, contributor_type, team_name')
        .eq('email', user.email)
        .single()

      if (data) setContributor(data)
    }
    load()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/contribute/signin')
  }

  const displayName = contributor?.contributor_type === 'team' && contributor?.team_name
    ? contributor.team_name
    : contributor?.name ?? '...'

  const firstColor = CATEGORY_COLOURS[contributor?.categories?.[0] ?? ''] ?? '#A78BFA'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: '#1C1730' }}>
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <Logo config="horizontal" size={0.62} />
        </Link>
      </div>

      {/* Contributor info */}
      <div className="px-6 py-5 border-b" style={{ borderColor: '#1C1730' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: 36,
              height: 36,
              background: firstColor + '18',
              border: `1px solid ${firstColor}35`,
            }}
          >
            <span style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 14,
              color: firstColor,
            }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 13,
              color: '#E8E6F0',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {contributor?.categories?.map((cat) => {
                const catColor = CATEGORY_COLOURS[cat] ?? '#A78BFA'
                return (
                  <span
                    key={cat}
                    style={{
                      fontFamily: 'Switzer, sans-serif',
                      fontSize: 8,
                      fontWeight: 500,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: catColor,
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: catColor + '15',
                      border: `1px solid ${catColor}25`,
                    }}
                  >
                    {cat}
                  </span>
                )
              })}
            </div>
          </div>
        </div>

        {/* Points summary */}
        <div
          className="flex items-center justify-between mt-4 pt-4"
          style={{ borderTop: '1px solid #1C1730' }}
        >
          <div className="flex flex-col gap-0.5">
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: firstColor, lineHeight: 1 }}>
              {contributor?.total_points?.toLocaleString() ?? '0'}
            </span>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: '#8B7EC8' }}>
              points
            </span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#5EEAD4', lineHeight: 1 }}>
              {contributor?.verified_contributions ?? '0'}
            </span>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: '#8B7EC8' }}>
              verified
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-1 list-none">
          {NAV_ITEMS.map((item) => {
            const itemPath = item.href.split('?')[0]
            const itemTab = new URLSearchParams(item.href.includes('?') ? item.href.split('?')[1] : '').get('tab')
            const currentTab = searchParams.get('tab')

            const isActive = itemTab
              ? pathname === itemPath && currentTab === itemTab
              : item.href === '/contribute/dashboard'
              ? pathname === '/contribute/dashboard' && !currentTab
              : pathname.startsWith(itemPath)
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                  style={{
                    background: isActive ? 'rgba(109,40,217,0.12)' : 'transparent',
                    color: isActive ? '#A78BFA' : '#8B7EC8',
                    textDecoration: 'none',
                    border: isActive ? '1px solid rgba(109,40,217,0.2)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <span style={{ color: isActive ? '#A78BFA' : '#8B7EC8', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                  }}>
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t" style={{ borderColor: '#1C1730' }}>
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full mb-1"
          style={{
            color: '#8B7EC8',
            textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13 }}>Back to site</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full"
          style={{
            color: '#8B7EC8',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(239,68,68,0.08)'
            el.style.color = '#FCA5A5'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'transparent'
            el.style.color = '#8B7EC8'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 2H2v12h4M11 5l3 3-3 3M14 8H6" />
          </svg>
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13 }}>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40"
        style={{
          width: 240,
          background: '#0F0D1A',
          borderRight: '1px solid #1C1730',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 py-4"
        style={{
          background: 'rgba(15,13,26,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1C1730',
          height: 60,
        }}
      >
        <Logo config="horizontal" size={0.6} />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {mobileOpen
            ? <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l12 12M16 4L4 16" /></svg>
            : <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 6h14M3 10h14M3 14h14" /></svg>
          }
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(13,11,20,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 flex flex-col"
            style={{
              width: 260,
              background: '#0F0D1A',
              borderRight: '1px solid #1C1730',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}

export default function Sidebar() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0B14' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid #1C1730',
          borderTop: '2px solid #6D28D9',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <SidebarContent />
    </Suspense>
  )
}