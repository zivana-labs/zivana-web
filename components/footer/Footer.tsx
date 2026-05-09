'use client'

import Link from 'next/link'
import Logo from '@/components/logo/Logo'
import { NAV_LINKS } from '@/lib/constants'

export default function Footer() {
  return (
    <footer style={{ background: '#0D0B14', borderTop: '1px solid #1C1730' }}>
      <div className="max-w-7xl mx-auto px-8 lg:px-14 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5 flex flex-col gap-5">
            <Logo config="horizontal" size={0.72} />
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', maxWidth: 340, lineHeight: 1.75 }}>
              Trust infrastructure for the African informal economy. Making economic capability visible, verifiable, and financeable.
            </p>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 400, fontSize: 12, color: '#8B7EC8', letterSpacing: '0.05em' }}>
              Built for Africans. Open to the world.
            </p>
          </div>

          <div className="lg:col-span-3 lg:col-start-7 flex flex-col gap-5">
            <span className="section-label">Protocol</span>
            <ul className="flex flex-col gap-3.5 list-none">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', textDecoration: 'none' }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#C4B5FD')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#7B6FA8')}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-5">
            <span className="section-label">Ecosystem</span>
            <ul className="flex flex-col gap-3.5 list-none">
              {[
                { label: 'Sovela', href: 'https://sovela.app', ext: true },
                { label: 'GitHub', href: 'https://github.com/zivana-labs', ext: true },
                { label: 'zivana.network', href: 'https://zivana.network', ext: false },
                { label: 'hello@zivana.network', href: 'mailto:hello@zivana.network', ext: false },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target={l.ext ? '_blank' : undefined}
                    rel={l.ext ? 'noopener noreferrer' : undefined}
                    style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', textDecoration: 'none' }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#C4B5FD')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#7B6FA8')}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ height: 1, background: '#1C1730', margin: '48px 0 32px' }} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8' }}>
            ZIVANA™ Protocol v0 — NexTrium Global Innovations Ltd — Lagos, Nigeria
          </span>
          <span
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 11,
              background: 'linear-gradient(135deg,#C4B5FD,#A78BFA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            github.com/zivana-labs
          </span>
        </div>
      </div>
    </footer>
  )
}