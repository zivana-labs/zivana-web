import type { Metadata } from 'next'
import Logo from '@/components/logo/Logo'

export const metadata: Metadata = {
  title: 'Litepaper — Zivana Protocol',
  description: 'The Zivana Protocol litepaper is in development.',
}

export default function LitepaperPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center text-center px-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#12092A 0%,#0D0B14 50%,#06020F 100%)' }}
    >
      <div
        className="absolute pointer-events-none rounded-full"
        style={{ width: 700, height: 500, background: 'radial-gradient(ellipse,rgba(109,40,217,0.1) 0%,transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
      />
      <div className="absolute inset-0 grid-overlay pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 max-w-lg py-36">
        <Logo config="stacked" size={1.3} showProtocol />

        <div style={{ height: 1, width: 64, background: '#1C1730' }} />

        <div className="flex flex-col items-center gap-5">
          <span className="section-label">Litepaper</span>
          <h1
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(32px,5vw,56px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
              color: '#E8E6F0',
            }}
          >
            In development.
          </h1>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 16, color: '#7B6FA8', lineHeight: 1.78 }}>
            The Zivana Protocol litepaper is being written alongside the build. It will document the protocol's economic model, governance design, and technical architecture in full.
          </p>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13.5, color: '#8B7EC8', lineHeight: 1.72 }}>
            In the meantime, the Master Build Plan covers all technical and architectural decisions in detail.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <a href="/protocol" className="btn-primary" style={{ fontSize: 13 }}>
            Read the Protocol
          </a>
          <a href="/build" className="btn-outline" style={{ fontSize: 13 }}>
            Build on Zivana
          </a>
        </div>
      </div>
    </div>
  )
}