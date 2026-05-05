import type { Metadata } from 'next'
import { PRIMITIVES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Protocol — Zivana',
  description: 'The five core primitives, three-layer stack, and governance model of the Zivana Protocol.',
}

export default function ProtocolPage() {
  return (
    <div className="pt-36 pb-24 bg-void min-h-screen">
      <div className="max-w-5xl mx-auto px-8 lg:px-14">

        <div className="mb-24">
          <span className="section-label block mb-7">Protocol</span>
          <h1 className="mb-8" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(44px,7vw,88px)', letterSpacing: '-0.03em', lineHeight: 1.0, color: '#E8E6F0' }}>
            Open infrastructure.<br />
            <span className="text-gradient">Nothing mandatory.</span>
          </h1>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 17, color: '#7B6FA8', maxWidth: 540, lineHeight: 1.78 }}>
            Zivana exposes five primitives at the protocol level. Every application built on Zivana interacts with these primitives. Applications choose which ones to use.
          </p>
        </div>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 64 }} />

        <section className="mb-24">
          <span className="section-label block mb-8">01 — Architecture</span>
          <h2 className="mb-8" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 32, letterSpacing: '-0.02em', color: '#E8E6F0' }}>Three-layer stack</h2>
          <div className="flex flex-col gap-3">
            {[
              { layer: 'Settlement', tech: 'Cardano Mainnet', desc: 'eUTxO distribution, $ZVN token, finality, Mithril state proofs. Final state anchoring for all protocol events.' },
              { layer: 'Privacy / ZK', tech: 'Midnight Network', desc: 'Shielded covenant state storage, ZK proof generation for distribution correctness, selective disclosure for compliance.' },
              { layer: 'Identity', tech: 'Hyperledger Identus', desc: 'DID issuance and resolution anchored on Cardano, verifiable credential issuance, W3C DID spec compliance.' },
            ].map((s) => (
              <div key={s.layer} className="grid grid-cols-3 gap-6 p-6 rounded-xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
                <span className="section-label">{s.layer}</span>
                <span style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 13.5, color: '#C4B5FD' }}>{s.tech}</span>
                <span style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.65 }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 64 }} />

        <section className="mb-24">
          <span className="section-label block mb-8">02 — Primitives</span>
          <h2 className="mb-8" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 32, letterSpacing: '-0.02em', color: '#E8E6F0' }}>Five core primitives</h2>
          <div className="flex flex-col gap-4">
            {PRIMITIVES.map((p) => (
              <div key={p.name} className="p-8 rounded-2xl border" style={{ background: '#0F0D1A', borderColor: '#1C1730' }}>
                <div className="flex items-start justify-between gap-8 mb-5">
                  <div>
                    <span className="section-label block mb-2">{p.number}</span>
                    <h3 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 22, color: '#E8E6F0', letterSpacing: '-0.01em' }}>{p.name}</h3>
                  </div>
                  <span
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg"
                    style={{ fontFamily: 'Courier New, monospace', fontSize: 12, background: `${p.color}16`, color: p.color, border: `1px solid ${p.color}28` }}
                  >
                    {p.namespace}
                  </span>
                </div>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.72 }}>{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 64 }} />

        <section>
          <span className="section-label block mb-8">03 — Governance</span>
          <h2 className="mb-6" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 32, letterSpacing: '-0.02em', color: '#E8E6F0' }}>Three regenerative constraints</h2>
          <p className="mb-8" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', maxWidth: 540, lineHeight: 1.75 }}>
            Protocol invariants written into the governance contract itself. No governance vote, regardless of majority, can override them.
          </p>
          <div className="flex flex-col gap-3">
            {[
              { n: '01', title: 'Surplus stays local', body: 'Protocol fees cannot exceed defined ceilings. The majority of value generated through any covenant must remain with the economic actors who generated it.' },
              { n: '02', title: 'Trust belongs to the holder', body: 'Every trust event belongs to the participant\'s DID-anchored identity, not to any application. Trust is portable across every Zivana application.' },
              { n: '03', title: 'Entry is path-independent', body: 'The protocol must function without requiring a bank account, a registered business, a smartphone, or prior blockchain experience.' },
            ].map((c) => (
              <div key={c.n} className="flex gap-6 p-7 rounded-xl border" style={{ background: '#13101E', borderColor: '#1E1640' }}>
                <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 20, color: '#A78BFA', flexShrink: 0, lineHeight: 1.4 }}>{c.n}</span>
                <div>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 14, color: '#E8E6F0', marginBottom: 6 }}>{c.title}</p>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13.5, color: '#7B6FA8', lineHeight: 1.68 }}>{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}