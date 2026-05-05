'use client'

import { useEffect, useRef } from 'react'
import ProblemViz from '@/components/illustrations/ProblemViz'

function RevealDiv({ children, delay = 0, className = '' }: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(32px)'
    el.style.transition = `opacity 0.85s ease ${delay}ms, transform 0.85s ease ${delay}ms`
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.disconnect() }
    }, { threshold: 0.12 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return <div ref={ref} className={className}>{children}</div>
}

export default function ProblemSection() {
  return (
    <section className="py-24 bg-void relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 lg:px-14">
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-36 items-center">

          {/* Left: illustration */}
          <RevealDiv>
            <ProblemViz />
          </RevealDiv>

          {/* Right: text */}
          <RevealDiv delay={150}>
            <span className="section-label block mb-7">The problem</span>
            <h2
              className="mb-8"
              style={{
                fontFamily: 'Cabinet Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: 'clamp(32px,4.5vw,56px)',
                letterSpacing: '-0.025em',
                lineHeight: 1.07,
                color: '#E8E6F0',
              }}
            >
              The barrier is not capability.
              <br />
              <span className="text-gradient">It is legibility.</span>
            </h2>
            <p
              style={{
                fontFamily: 'Switzer, sans-serif',
                fontWeight: 300,
                fontSize: 17,
                color: '#7B6FA8',
                maxWidth: 500,
                lineHeight: 1.78,
              }}
            >
              A trader in Lagos with five years of consistent sales history and a reputation her community trusts cannot demonstrate any of this to a funder in Amsterdam. Her trust does not travel. Zivana makes it travel.
            </p>
          </RevealDiv>

        </div>
      </div>
    </section>
  )
}