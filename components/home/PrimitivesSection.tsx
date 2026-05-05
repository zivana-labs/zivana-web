'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import PrimitivesSystem from '@/components/illustrations/PrimitivesSystem'

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(28px)'
    el.style.transition = `opacity 0.75s ease ${delay}ms, transform 0.75s ease ${delay}ms`
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.disconnect() }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return ref
}

export default function PrimitivesSection() {
  const header = useReveal()

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#0D0B14 0%,#0F0C1E 50%,#0D0B14 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-8 lg:px-14">
        <div ref={header} className="text-center max-w-xl mx-auto mb-20">
          <span className="section-label block mb-5">The protocol</span>
          <h2
            className="mb-5"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(32px,4.5vw,54px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.07,
              color: '#E8E6F0',
            }}
          >
            Five core primitives
          </h2>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15.5, color: '#7B6FA8', lineHeight: 1.75 }}>
            Generic at the protocol level. Specific at the application level. Nothing is mandatory.
          </p>
        </div>

        <PrimitivesSystem />

        <div className="text-center mt-16">
          <Link href="/protocol" className="btn-outline">
            Deep dive into the protocol
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 7h10M8 3l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}