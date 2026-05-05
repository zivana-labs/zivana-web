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
          {NAV_LINKS.map((l) => (
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
              color: '#4A3E7A',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#7B6FA8')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#4A3E7A')}
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
              {NAV_LINKS.map((l) => (
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
            </ul>
            <Link href="/build" className="btn-primary">Build on Zivana</Link>
          </div>
        </div>
      )}
    </>
  )
}