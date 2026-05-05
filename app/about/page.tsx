import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — Zivana Protocol',
  description: 'The mission, origin, and roadmap of the Zivana Protocol.',
}

export default function AboutPage() {
  return (
    <div className="pt-36 pb-24 bg-void min-h-screen">
      <div className="max-w-5xl mx-auto px-8 lg:px-14">

        {/* Mission */}
        <section className="mb-24">
          <span className="section-label block mb-7">01 — Mission</span>
          <h1
            className="mb-10"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(44px,7vw,88px)',
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              color: '#E8E6F0',
            }}
          >
            The invisible economy
            <br />
            <span className="text-gradient">deserves visible trust.</span>
          </h1>
          <div className="grid lg:grid-cols-2 gap-10 max-w-4xl">
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 17, color: '#7B6FA8', lineHeight: 1.78 }}>
              Hundreds of millions of people across Africa participate in informal economic activity, producing real value and building real reputations, yet remain invisible to formal capital markets. The barrier is not productivity. It is legibility.
            </p>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#4A3E7A', lineHeight: 1.78 }}>
              Zivana is the infrastructure that makes economic trust visible, portable, and verifiable across boundaries, without requiring anyone to surrender ownership of that trust to any platform. Trust, once earned, should travel with the person who earned it.
            </p>
          </div>
        </section>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 64 }} />

        {/* Organisation */}
        <section className="mb-24">
          <span className="section-label block mb-7">02 — Organisation</span>
          <h2
            className="mb-12"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(28px,3.5vw,48px)', letterSpacing: '-0.02em', lineHeight: 1.1, color: '#E8E6F0' }}
          >
            Built in Lagos. Open to the world.
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: 'NexTrium Global Innovations Ltd', role: 'Legal entity', detail: 'Incorporated in Nigeria under the Corporate Affairs Commission.' },
              { name: 'Next Trend Labs', role: 'Product and engineering', detail: 'The engineering and product organisation behind Zivana Protocol and Sovela.' },
              { name: 'Zivana Labs', role: 'Protocol organisation', detail: 'github.com/zivana-labs — eleven open repositories, public from day one.' },
            ].map((o) => (
              <div key={o.name} className="p-6 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 14, color: '#E8E6F0', marginBottom: 4 }}>{o.name}</p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B5CF6', marginBottom: 10, letterSpacing: '0.04em' }}>{o.role}</p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12.5, color: '#7B6FA8', lineHeight: 1.65 }}>{o.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 64 }} />

        {/* Roadmap */}
        <section>
          <span className="section-label block mb-7">03 — Roadmap</span>
          <h2 className="mb-12" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(28px,3.5vw,48px)', letterSpacing: '-0.02em', lineHeight: 1.1, color: '#E8E6F0' }}>
            Four phases. Hard gates between each.
          </h2>
          <div className="flex flex-col gap-4">
            {[
              { code: 'Phase 0', title: 'Foundation Verification', duration: '8 to 10 weeks', status: 'Active', desc: 'Prove every stack component works before any protocol logic is built on top. Environment verification across Cardano, Midnight, Identus, and the oracle infrastructure.' },
              { code: 'Phase 1', title: 'Core Primitive Implementation', duration: '12 to 16 weeks', status: 'Upcoming', desc: 'Implement all five primitives on Cardano preprod and Midnight devnet. Deploy $ZVN on testnet. Execute a complete end-to-end cycle with zero human intervention.' },
              { code: 'Phase 2', title: 'SDK and Developer Interface', duration: '10 to 14 weeks', status: 'Upcoming', desc: 'Make the protocol buildable by developers outside the core team. TypeScript, JavaScript, and Python SDKs. Schema Registry. Governance contracts. External developer validation.' },
              { code: 'Phase 3', title: 'Sovela Migration and Mainnet', duration: '10 to 14 weeks', status: 'Upcoming', desc: 'Migrate Sovela to run on Zivana Protocol. External security audit. $ZVN mainnet launch. Community distribution. First real covenant on mainnet is the protocol genesis event.' },
            ].map((p) => (
              <div
                key={p.code}
                className="relative flex gap-6 p-7 rounded-2xl border overflow-hidden"
                style={{
                  background: p.status === 'Active' ? 'linear-gradient(135deg,#13101E,#160F2A)' : '#13101E',
                  borderColor: p.status === 'Active' ? '#6D28D9' : '#1C1730',
                }}
              >
                {p.status === 'Active' && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: 'linear-gradient(180deg,#A78BFA,#4C1D95)' }} />
                )}
                <div className="flex-shrink-0 w-20">
                  <span style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: p.status === 'Active' ? '#A78BFA' : '#2D2450' }}>
                    {p.code}
                  </span>
                  <span
                    className="block mt-2 px-2 py-0.5 rounded-full text-center"
                    style={{
                      background: p.status === 'Active' ? 'rgba(109,40,217,0.18)' : 'rgba(45,36,80,0.25)',
                      color: p.status === 'Active' ? '#A78BFA' : '#4A3E7A',
                      fontFamily: 'Switzer, sans-serif',
                      fontSize: 9,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <span style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 15, color: '#E8E6F0' }}>{p.title}</span>
                    <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#4A3E7A', flexShrink: 0 }}>{p.duration}</span>
                  </div>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13.5, color: '#7B6FA8', lineHeight: 1.65 }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}