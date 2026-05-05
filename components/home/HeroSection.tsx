'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import Logo from '@/components/logo/Logo'

export default function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'
    const t = setTimeout(() => {
      el.style.transition = 'opacity 1s ease, transform 1s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#12092A 0%,#0D0B14 50%,#06020F 100%)' }}
    >
      {/* Orbs */}
      <div className="absolute rounded-full pointer-events-none animate-float-1"
        style={{ width: 700, height: 700, background: '#6D28D9', filter: 'blur(130px)', opacity: 0.1, top: -250, right: -150 }} />
      <div className="absolute rounded-full pointer-events-none animate-float-2"
        style={{ width: 500, height: 500, background: '#4C1D95', filter: 'blur(110px)', opacity: 0.09, bottom: -100, left: '3%' }} />
      <div className="absolute rounded-full pointer-events-none animate-float-3"
        style={{ width: 320, height: 320, background: '#1C5F8A', filter: 'blur(90px)', opacity: 0.07, top: '35%', left: '42%' }} />

      {/* Grid + noise */}
      <div className="absolute inset-0 grid-overlay pointer-events-none" />
      <div className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Content */}
      <div
        ref={contentRef}
        className="relative z-10 max-w-7xl mx-auto px-8 lg:px-14 w-full pt-36 pb-24"
      >
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Left */}
          <div>
            {/* Badge */}
            <div
              className="inline-flex items-center gap-3 mb-10 px-4 py-2.5 rounded-full border"
              style={{ background: 'rgba(109,40,217,0.08)', borderColor: 'rgba(109,40,217,0.22)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse-dot"
                style={{ flexShrink: 0 }}
              />
              <span className="section-label" style={{ color: '#A78BFA' }}>
                Open Protocol on Cardano and Midnight
              </span>
            </div>

            {/* Headline */}
            <h1
              className="mb-8"
              style={{
                fontFamily: 'Cabinet Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(56px,8.5vw,100px)',
                letterSpacing: '-0.03em',
                lineHeight: 1.0,
                color: '#E8E6F0',
              }}
            >
              Trust <span className="text-gradient">Made</span>
              <br />
              Visible
            </h1>

            {/* Body */}
            <p
              className="mb-12"
              style={{
                fontFamily: 'Switzer, sans-serif',
                fontWeight: 200,
                fontSize: 'clamp(16px,1.5vw,19px)',
                color: '#7B6FA8',
                maxWidth: 510,
                lineHeight: 1.78,
              }}
            >
              An open Layer 2 protocol that makes economic capability visible, verifiable, and financeable for the African informal economy, without requiring anyone to become formal first.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/protocol" className="btn-primary">
                Explore the protocol
              </Link>
              <a
                href="https://github.com/zivana-labs"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                View on GitHub
              </a>
            </div>

          </div>

          {/* Right: large mark + floating cards */}
          <div className="hidden lg:flex items-center justify-center relative" style={{ minHeight: 500 }}>
            {/* Rings */}
            {[500, 390, 280].map((size) => (
              <div
                key={size}
                className="absolute rounded-full border"
                style={{
                  width: size, height: size,
                  borderColor: 'rgba(109,40,217,0.07)',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                }}
              />
            ))}

            {/* Mark */}
            <Logo config="icon" size={3.4} className="relative z-10" />

            {/* Floating card: Trust score */}
            <div
              className="absolute z-20 rounded-xl border px-5 py-4"
              style={{
                top: '8%', right: '2%',
                minWidth: 188,
                background: 'rgba(19,16,30,0.92)',
                backdropFilter: 'blur(16px)',
                borderColor: '#1C1730',
                animation: 'float1 6s ease-in-out infinite',
              }}
            >
              <p className="section-label mb-2">Trust score</p>
              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, color: '#E8E6F0', lineHeight: 1, marginBottom: 8 }}>847</p>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(15,118,110,0.16)', color: '#5EEAD4', border: '1px solid rgba(15,118,110,0.24)', fontFamily: 'Switzer, sans-serif' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#5EEAD4' }} />
                Verified
              </span>
            </div>

            {/* Floating card: Covenants */}
            <div
              className="absolute z-20 rounded-xl border px-5 py-4"
              style={{
                bottom: '12%', left: '2%',
                minWidth: 170,
                background: 'rgba(19,16,30,0.92)',
                backdropFilter: 'blur(16px)',
                borderColor: '#1C1730',
                animation: 'float2 8s ease-in-out infinite',
              }}
            >
              <p className="section-label mb-2">Active covenants</p>
              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, color: '#E8E6F0', lineHeight: 1, marginBottom: 8 }}>24</p>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(109,40,217,0.16)', color: '#A78BFA', border: '1px solid rgba(109,40,217,0.24)', fontFamily: 'Switzer, sans-serif' }}
              >
                On-chain
              </span>
            </div>

            {/* Floating code card */}
            <div
              className="absolute z-20 rounded-xl border px-4 py-3"
              style={{
                bottom: '4%', right: '10%',
                background: 'rgba(13,11,20,0.95)',
                backdropFilter: 'blur(16px)',
                borderColor: '#1C1730',
                animation: 'float1 10s ease-in-out infinite 1.5s',
              }}
            >
              <span style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: '#8B5CF6' }}>
                ZVN.Distribution.attest()
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 z-10">
        <span className="section-label" style={{ fontSize: 9 }}>Scroll</span>
        <div style={{ width: 1, height: 48, background: 'linear-gradient(180deg,rgba(109,40,217,0.6),transparent)' }} />
      </div>
    </section>
  )
}