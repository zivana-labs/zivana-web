'use client'

import { useEffect, useRef } from 'react'
import { ZVN_UTILITIES } from '@/lib/constants'

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(28px)'
    el.style.transition = `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return ref
}

export default function ZVNSection() {
  const left = useReveal()
  const right = useReveal(120)

  return (
    <section className="py-24 bg-void">
      <div className="max-w-7xl mx-auto px-8 lg:px-14">
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-36 items-center">
          {/* Token visual */}
          <div ref={left} className="flex flex-col items-center gap-8">
            <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
              {/* Static rings */}
              {[220, 170, 120].map((s) => (
                <div key={s} className="absolute rounded-full border" style={{ width: s, height: s, borderColor: 'rgba(109,40,217,0.15)' }} />
              ))}
              {/* Spinning dashed ring */}
              <div
                className="absolute rounded-full animate-spin-slow"
                style={{ width: 240, height: 240, border: '1px dashed rgba(109,40,217,0.28)' }}
              />
              {/* Token */}
              <div
                className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg,#6D28D9,#4C1D95)',
                  boxShadow: '0 0 64px rgba(109,40,217,0.5)',
                }}
              >
                <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 17, color: '#E8E6F0', letterSpacing: '-0.01em' }}>
                  $ZVN
                </span>
              </div>
            </div>

            {/* Utility grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {ZVN_UTILITIES.map((u) => (
                <div
                  key={u.name}
                  className="p-4 rounded-xl border"
                  style={{ background: '#13101E', borderColor: '#1C1730', transition: 'border-color 0.3s' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#6D28D9')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#1C1730')}
                >
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 12, color: '#C4B5FD', marginBottom: 5 }}>{u.name}</p>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 11.5, color: '#7B6FA8', lineHeight: 1.6 }}>{u.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div ref={right}>
            <span className="section-label block mb-7">Protocol token</span>
            <h2
              className="mb-6"
              style={{
                fontFamily: 'Cabinet Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(28px,3.8vw,48px)',
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                color: '#E8E6F0',
              }}
            >
              $ZVN is not a fundraising instrument.
            </h2>
            <p className="mb-5" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 16, color: '#7B6FA8', lineHeight: 1.78 }}>
              It is the economic nervous system of the protocol. Four specific functions the protocol cannot operate without.
            </p>
            <p className="mb-5" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#4A3E7A', lineHeight: 1.75 }}>
              $ZVN is a Cardano native asset with a fixed total supply, minted once at genesis, never increased. No venture capital allocation at genesis.
            </p>
            <p className="mb-10" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#4A3E7A', lineHeight: 1.75 }}>
              Team tokens vest over four years with a one-year cliff. Community distribution targets Sovela users, the Cardano ecosystem, and the African Web3 community.
            </p>

            <div className="p-6 rounded-xl border" style={{ background: '#0F0D1A', borderColor: '#1E1640' }}>
              <span className="section-label block mb-4">Distribution principles</span>
              <div className="flex flex-col gap-4">
                {[
                  'No VC allocation at genesis. Funded through grants and ecosystem contributions.',
                  'Team tokens vest over four years with a one-year cliff.',
                  'Community distribution: Sovela users, Cardano ecosystem, African Web3 community.',
                ].map((t, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: '#8B5CF6', flexShrink: 0, lineHeight: 1.5 }}>
                      0{i + 1}
                    </span>
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.65 }}>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}