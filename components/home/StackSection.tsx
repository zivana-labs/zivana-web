'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import StackFlow from '@/components/illustrations/StackFlow'

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

export default function StackSection() {
  const left = useReveal()
  const right = useReveal(120)

  return (
    <section className="py-24 bg-void">
      <div className="max-w-7xl mx-auto px-8 lg:px-14">
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-36 items-start">
          <div ref={left}>
            <span className="section-label block mb-7">Technology stack</span>
            <h2
              className="mb-8"
              style={{
                fontFamily: 'Cabinet Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(28px,3.8vw,50px)',
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                color: '#E8E6F0',
              }}
            >
              Inherited security.
              <br />
              <span className="text-gradient">Built for trust.</span>
            </h2>
            <p className="mb-10" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 16, color: '#7B6FA8', maxWidth: 460, lineHeight: 1.78 }}>
              Zivana inherits settlement from Cardano, privacy from Midnight, and identity from Hyperledger Identus. Production-verified. Open source.
            </p>
            <Link href="/technology" className="btn-outline" style={{ fontSize: 13 }}>
              Explore the full stack
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 7h10M8 3l4 4-4 4" />
              </svg>
            </Link>
          </div>

          <div ref={right}>
            <StackFlow />
          </div>
        </div>
      </div>
    </section>
  )
}