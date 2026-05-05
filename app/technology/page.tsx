import type { Metadata } from 'next'
import { STACK } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Technology — Zivana Protocol',
  description: 'The verified technical stack powering the Zivana Protocol.',
}

export default function TechnologyPage() {
  return (
    <div className="pt-36 pb-44 bg-void min-h-screen">
      <div className="max-w-5xl mx-auto px-8 lg:px-14">

        <div className="mb-24">
          <span className="section-label block mb-7">Technology</span>
          <h1 className="mb-8" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(44px,7vw,88px)', letterSpacing: '-0.03em', lineHeight: 1.0, color: '#E8E6F0' }}>
            Production-verified.<br />
            <span className="text-gradient">Open source.</span>
          </h1>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 17, color: '#7B6FA8', maxWidth: 540, lineHeight: 1.78 }}>
            Every component has been verified against current operational status. No component is included based on documentation alone. Maturity ratings are honest.
          </p>
        </div>

        <div className="flex flex-col gap-5 mb-16">
          {STACK.map((s) => (
            <div key={s.layer} className="p-8 rounded-2xl border" style={{ background: '#0F0D1A', borderColor: '#1C1730' }}>
              <div className="flex items-center gap-4 mb-5">
                <span
                  className="px-3 py-1 rounded-full"
                  style={{ background: `${s.color}20`, color: s.labelColor, border: `1px solid ${s.color}40`, fontFamily: 'Switzer, sans-serif', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase' }}
                >
                  {s.layer}
                </span>
                <h3 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 20, color: '#E8E6F0' }}>{s.tech}</h3>
              </div>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.72 }}>{s.description}</p>
            </div>
          ))}
        </div>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 64 }} />

        <div className="p-8 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1E1640' }}>
          <h3 className="mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 20, color: '#E8E6F0' }}>
            A note on Compact
          </h3>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.72, maxWidth: 580 }}>
            Midnight's Compact language does not appear in AI coding assistant training data in usable form. All Compact contracts in this protocol are hand-written against official documentation at docs.midnight.network. This is an early-ecosystem reality, not a permanent constraint. We are honest about it.
          </p>
        </div>

      </div>
    </div>
  )
}