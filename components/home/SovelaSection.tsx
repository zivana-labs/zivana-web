'use client'

import { useEffect, useRef } from 'react'
import SovelaCard from '@/components/illustrations/SovelaCard'

function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(28px)'
    el.style.transition = `opacity 0.85s ease ${delay}ms, transform 0.85s ease ${delay}ms`
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
        obs.disconnect()
      }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return ref
}

export default function SovelaSection() {
  const left = useReveal()
  const right = useReveal(150)

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#0D0B14,#100D1F)' }}
    >
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 700, height: 500,
          background: 'radial-gradient(ellipse,rgba(109,40,217,0.1) 0%,transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-14">
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-36 items-center">

          {/* Left: interactive covenant illustration */}
          <div ref={left}>
            <SovelaCard />
          </div>

          {/* Right: text */}
          <div ref={right} className="flex flex-col gap-6">
            <span className="section-label">Genesis application</span>
            <h2
              style={{
                fontFamily: 'Cabinet Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(40px,5.5vw,72px)',
                letterSpacing: '-0.03em',
                lineHeight: 1.02,
                color: '#E8E6F0',
              }}
            >
              Sovela
            </h2>
            <p
              style={{
                fontFamily: 'Switzer, sans-serif',
                fontWeight: 300,
                fontSize: 17,
                color: '#7B6FA8',
                lineHeight: 1.78,
                maxWidth: 440,
              }}
            >
              Regenerative capital for economic actors whose capability is real but invisible to formal finance. Profit-sharing covenants that replace extractive lending with aligned growth.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <a
                href="https://sovela.app"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ fontSize: 13 }}
              >
                Visit Sovela
              </a>
              <a
                href="/build"
                className="btn-outline"
                style={{ fontSize: 13 }}
              >
                Build on Zivana
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}