'use client'

import { useEffect, useRef } from 'react'

export default function CTASection() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = '0'
    el.style.transform = 'translateY(28px)'
    el.style.transition = 'opacity 0.9s ease, transform 0.9s ease'
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section
      className="py-24 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#0D0B14 0%,#12092A 50%,#0D0B14 100%)' }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          width: 900, height: 450,
          background: 'radial-gradient(ellipse,rgba(109,40,217,0.14) 0%,transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
        }}
      />

      <div ref={ref} className="relative z-10 max-w-3xl mx-auto px-8 lg:px-14">
        <span className="section-label block mb-8">Built for Africans. Open to the world.</span>
        <h2
          className="mb-6"
          style={{
            fontFamily: 'Cabinet Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(36px,4.5vw,66px)',
            letterSpacing: '-0.03em',
            lineHeight: 1.0,
            color: '#E8E6F0',
          }}
        >
          The invisible economy deserves visible trust.
        </h2>
        <p
          className="mb-14 mx-auto"
          style={{
            fontFamily: 'Switzer, sans-serif',
            fontWeight: 300,
            fontSize: 17,
            color: '#7B6FA8',
            maxWidth: 520,
            lineHeight: 1.78,
          }}
        >
          Zivana Protocol is in active development.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="https://github.com/zivana-labs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            View the build on GitHub
          </a>
          <a href="mailto:hello@zivana.network" className="btn-outline">
            Get in touch
          </a>
        </div>
      </div>
    </section>
  )
}