'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Logo from '@/components/logo/Logo'
import { createClient } from '@/lib/supabase/client'

export default function PortalTopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    }
    checkAuth()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/contribute')
  }

  if (loading || !user) return null

  const NAV_ITEMS = [
    { href: '/contribute/dashboard', label: 'Dashboard' },
    { href: '/contribute/tasks', label: 'Tasks' },
    { href: '/contribute/leaderboard', label: 'Leaderboard' },
  ]

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-6 lg:px-10"
      style={{
        height: 56,
        background: 'rgba(15,13,26,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1C1730',
      }}
    >
      {/* Left — Logo */}
      <Link href="/">
        <Logo config="horizontal" size={0.6} />
      </Link>

      {/* Centre — Nav items */}
      <nav className="hidden sm:flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-1.5 rounded-lg"
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontSize: 13,
              fontWeight: pathname === item.href ? 500 : 400,
              color: pathname === item.href ? '#A78BFA' : '#8B7EC8',
              textDecoration: 'none',
              background: pathname === item.href ? 'rgba(109,40,217,0.1)' : 'transparent',
              border: pathname === item.href ? '1px solid rgba(109,40,217,0.2)' : '1px solid transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (pathname !== item.href) {
                const el = e.currentTarget as HTMLElement
                el.style.color = '#C4B5FD'
                el.style.background = 'rgba(109,40,217,0.06)'
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== item.href) {
                const el = e.currentTarget as HTMLElement
                el.style.color = '#8B7EC8'
                el.style.background = 'transparent'
              }
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right — Sign out */}
      <div className="flex items-center gap-4">
        <span
          style={{
            fontFamily: 'Switzer, sans-serif',
            fontSize: 12,
            color: '#8B7EC8',
          }}
          className="hidden sm:block"
        >
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          style={{
            fontFamily: 'Switzer, sans-serif',
            fontSize: 12,
            fontWeight: 500,
            color: '#8B7EC8',
            background: 'none',
            border: '1px solid #1C1730',
            borderRadius: 8,
            padding: '5px 12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.color = '#FCA5A5'
            el.style.borderColor = 'rgba(239,68,68,0.3)'
            el.style.background = 'rgba(239,68,68,0.08)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.color = '#8B7EC8'
            el.style.borderColor = '#1C1730'
            el.style.background = 'none'
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}