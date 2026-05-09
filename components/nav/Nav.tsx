'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import Logo from '@/components/logo/Logo'
import { NAV_LINKS } from '@/lib/constants'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [contributeOpen, setContributeOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 lg:px-14 transition-all duration-300"
        style={{
          height: scrolled ? 64 : 80,
          background: scrolled ? 'rgba(13,11,20,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid #1C1730' : '1px solid transparent',
        }}
      >
        <Link href="/" aria-label="Zivana home">
          <Logo config="horizontal" size={0.68} />
        </Link>

        <ul className="hidden lg:flex items-center gap-9 list-none">
          {NAV_LINKS.filter(l => l.label !== 'Contribute').map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontSize: 13,
                  fontWeight: 400,
                  letterSpacing: '0.02em',
                  color: pathname === l.href ? '#A78BFA' : '#7B6FA8',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => { if (pathname !== l.href) (e.target as HTMLElement).style.color = '#C4B5FD' }}
                onMouseLeave={(e) => { if (pathname !== l.href) (e.target as HTMLElement).style.color = '#7B6FA8' }}
              >
                {l.label}
              </Link>
            </li>
          ))}

          {/* Contribute dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setContributeOpen(true)}
            onMouseLeave={() => setContributeOpen(false)}
          >
            <button
              style={{
                fontFamily: 'Switzer, sans-serif',
                fontSize: 13,
                fontWeight: 400,
                letterSpacing: '0.02em',
                color: pathname.startsWith('/contribute') ? '#A78BFA' : '#7B6FA8',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'color 0.2s',
              }}
            >
              Contribute
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{
                  transition: 'transform 0.2s',
                  transform: contributeOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>

            {/* Dropdown panel */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                paddingTop: 12,
                transform: contributeOpen
                  ? 'translateX(-50%) translateY(0)'
                  : 'translateX(-50%) translateY(-6px)',
                opacity: contributeOpen ? 1 : 0,
                pointerEvents: contributeOpen ? 'auto' : 'none',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                zIndex: 100,
              }}
            >
            <div
              style={{
                background: '#13101E',
                border: '1px solid #1C1730',
                borderRadius: 12,
                padding: '6px',
                minWidth: 200,
                boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
              }}
            >
              {[
                {
                  href: '/contribute',
                  label: 'Overview',
                  desc: 'How contributing works',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="7" cy="7" r="6" />
                      <path d="M7 4v3l2 2" />
                    </svg>
                  ),
                },
                {
                  href: '/contribute/tasks',
                  label: 'Open tasks',
                  desc: 'Browse available work',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="1" y="1" width="12" height="12" rx="2" />
                      <path d="M4 5h6M4 7.5h4M4 10h3" />
                    </svg>
                  ),
                },
                {
                  href: '/contribute/leaderboard',
                  label: 'Leaderboard',
                  desc: 'Contributor rankings',
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1 11h3V6H1zM5.5 11h3V3h-3zM10 11h3V7.5h-3z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setContributeOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                    background: pathname === item.href ? 'rgba(109,40,217,0.12)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== item.href)
                      (e.currentTarget as HTMLElement).style.background = 'rgba(109,40,217,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== item.href)
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <span style={{ color: pathname === item.href ? '#A78BFA' : '#8B7EC8', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span
                      style={{
                        fontFamily: 'Switzer, sans-serif',
                        fontSize: 13,
                        fontWeight: 500,
                        color: pathname === item.href ? '#A78BFA' : '#E8E6F0',
                        lineHeight: 1.2,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'Switzer, sans-serif',
                        fontSize: 11,
                        color: '#8B7EC8',
                        lineHeight: 1.2,
                      }}
                    >
                      {item.desc}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            </div>
          </li>
        </ul>

        <div className="hidden lg:flex items-center gap-4">
          <a
            href="https://github.com/zivana-labs"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#8B7EC8',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#7B6FA8')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8B7EC8')}
          >
            GitHub
          </a>
          <Link href="/build" className="btn-primary" style={{ fontSize: 12, padding: '10px 22px' }}>
            Build on Zivana
          </Link>
        </div>

        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          style={{ color: '#7B6FA8' }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(13,11,20,0.95)', backdropFilter: 'blur(24px)' }}
        >
          <div className="flex flex-col items-center justify-center h-full gap-10">
            <Logo config="stacked" size={0.9} />
            <ul className="flex flex-col items-center gap-8 list-none">
              {NAV_LINKS.filter(l => l.label !== 'Contribute').map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{
                      fontFamily: 'Cabinet Grotesk, sans-serif',
                      fontWeight: 600,
                      fontSize: 28,
                      letterSpacing: '-0.01em',
                      color: pathname === l.href ? '#A78BFA' : '#E8E6F0',
                      textDecoration: 'none',
                    }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {/* Contribute sub-links on mobile */}
              <li className="flex flex-col items-center gap-4">
                <span
                  style={{
                    fontFamily: 'Cabinet Grotesk, sans-serif',
                    fontWeight: 600,
                    fontSize: 28,
                    letterSpacing: '-0.01em',
                    color: pathname.startsWith('/contribute') ? '#A78BFA' : '#E8E6F0',
                  }}
                >
                  Contribute
                </span>
                <div className="flex flex-col items-center gap-3">
                  {[
                    { href: '/contribute', label: 'Overview' },
                    { href: '/contribute/tasks', label: 'Open tasks' },
                    { href: '/contribute/leaderboard', label: 'Leaderboard' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        fontFamily: 'Switzer, sans-serif',
                        fontSize: 15,
                        color: pathname === item.href ? '#A78BFA' : '#8B7EC8',
                        textDecoration: 'none',
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </li>
            </ul>
            <Link href="/build" className="btn-primary">Build on Zivana</Link>
          </div>
        </div>
      )}
    </>
  )
}
