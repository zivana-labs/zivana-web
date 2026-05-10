'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/components/logo/Logo'
import { createClient } from '@/lib/supabase/client'

type CoreTeamMember = {
  id: string
  name: string
  role: string
  department: string
}

const NAV_ITEMS = [
  {
    label: 'Overview',
    href: '/admin/dashboard',
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
    label: 'Contributors',
    href: '/admin/dashboard/contributors',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="6" cy="5" r="3" />
        <path d="M1 13c0-2.761 2.239-5 5-5s5 2.239 5 5" />
        <path d="M11 3c1.657 0 3 1.343 3 3s-1.343 3-3 3" />
        <path d="M13 13c0-1.657-.895-3.122-2.236-3.873" />
      </svg>
    ),
  },
  {
    label: 'Contributions',
    href: '/admin/dashboard/contributions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 1v14M1 8h14" />
      </svg>
    ),
  },
  {
    label: 'Tasks',
    href: '/admin/dashboard/tasks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="1" width="14" height="14" rx="2" />
        <path d="M4 5h8M4 8h6M4 11h4" />
      </svg>
    ),
  },
  {
    label: 'Core Team',
    href: '/admin/dashboard/team',
    founderOnly: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" />
      </svg>
    ),
  },
]

function AdminSidebarContent() {
  const pathname = usePathname()
  const router = useRouter()
  const [member, setMember] = useState<CoreTeamMember | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/contribute/signin')
        return
      }

      const { data } = await supabase
        .from('core_team')
        .select('id, name, role, department')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!data) {
        router.push('/contribute/dashboard')
        return
      }

      setMember(data)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/contribute/signin')
  }

  const isFounder = member?.role === 'founder'
  const visibleNavItems = NAV_ITEMS.filter(item => !item.founderOnly || isFounder)

  const SidebarInner = () => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: '#1C1730' }}>
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <Logo config="horizontal" size={0.62} />
        </Link>
      </div>

      {/* Admin label */}
      <div className="px-6 py-3 border-b" style={{ borderColor: '#1C1730', background: 'rgba(109,40,217,0.06)' }}>
        <div className="flex items-center gap-2">
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#A78BFA',
            }}
          />
          <span style={{
            fontFamily: 'Switzer, sans-serif',
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#A78BFA',
          }}>
            Admin Panel
          </span>
          {member && (
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'Switzer, sans-serif',
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#6B5FA0',
              padding: '1px 6px',
              borderRadius: 10,
              background: 'rgba(109,40,217,0.1)',
            }}>
              {member.role}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-1 list-none">
          {visibleNavItems.map((item) => {
            const isActive = item.href === '/admin/dashboard'
              ? pathname === '/admin/dashboard'
              : pathname.startsWith(item.href)

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
        {/* Switch to contributor */}
        <Link
          href="/contribute/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full mb-1"
          style={{
            color: '#A78BFA',
            textDecoration: 'none',
            transition: 'background 0.2s',
            background: 'rgba(109,40,217,0.06)',
            border: '1px solid rgba(109,40,217,0.15)',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.12)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.06)')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 1L1 8l7 7M1 8h14" />
          </svg>
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13 }}>
            Contributor portal
          </span>
        </Link>

        {/* Back to site */}
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
            <path d="M8 1L1 8l7 7M1 8h14" />
          </svg>
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13 }}>Back to site</span>
        </Link>

        {/* Sign out */}
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

  if (loading) return null

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
        <SidebarInner />
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
            <SidebarInner />
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminSidebar() {
  return (
    <Suspense fallback={null}>
      <AdminSidebarContent />
    </Suspense>
  )
}