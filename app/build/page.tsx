import type { Metadata } from 'next'
import RepoGrid from '@/components/build/RepoGrid'

export const metadata: Metadata = {
  title: 'Build — Zivana Protocol',
  description: 'Build trust-enabled financial applications on the Zivana Protocol.',
}

export default function BuildPage() {
  return (
    <div className="pt-36 pb-24 bg-void min-h-screen">
      <div className="max-w-5xl mx-auto px-8 lg:px-14">

        <div className="mb-24">
          <span className="section-label block mb-7">Build on Zivana</span>
          <h1 className="mb-8" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(44px,7vw,88px)', letterSpacing: '-0.03em', lineHeight: 1.0, color: '#E8E6F0' }}>
            Build anything.<br />
            <span className="text-gradient">Own everything.</span>
          </h1>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 17, color: '#7B6FA8', maxWidth: 540, lineHeight: 1.78 }}>
            The five primitives are generic at the protocol level. Applications choose which ones to use. Trust profiles built on any Zivana application travel with the holder forever.
          </p>
        </div>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 64 }} />

        <section className="mb-24">
          <span className="section-label block mb-8">01 — SDK</span>
          <h2 className="mb-8" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, color: '#E8E6F0', letterSpacing: '-0.01em' }}>Three languages. Five namespaces.</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { lang: 'TypeScript', install: 'npm install @zivana-dev/sdk-ts', color: '#1C5F8A', tc: '#7DD3FC' },
              { lang: 'JavaScript', install: 'npm install @zivana-dev/sdk-js', color: '#92400E', tc: '#FCD34D' },
              { lang: 'Python',     install: 'pip install zivana-sdk',         color: '#065F46', tc: '#6EE7B7' },
            ].map((s) => (
              <div key={s.lang} className="p-5 rounded-xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 13, color: '#E8E6F0' }}>{s.lang}</span>
                  <span className="px-2 py-0.5 rounded text-xs" style={{ background: `${s.color}22`, color: s.tc, fontFamily: 'Switzer, sans-serif', fontSize: 10 }}>npm</span>
                </div>
                <code style={{ fontFamily: 'Courier New, monospace', fontSize: 11.5, color: '#A78BFA', wordBreak: 'break-all' }}>{s.install}</code>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border" style={{ background: '#0D0B14', borderColor: '#1C1730' }}>
            <pre className="p-7" style={{ fontFamily: 'Courier New, monospace', fontSize: 13, color: '#C4B5FD', lineHeight: 1.65, margin: 0 }}>{`import { ZVN } from '@zivana-dev/sdk-ts'

const client = new ZVN.Client({ network: 'preprod' })

// Issue a participant credential
const credential = await client.Identity.issue({
  did: participant_did,
  role: 'Economic Actor',
  jurisdiction: 'NG',
})

// Generate proof of trust threshold
const proof = await client.Trust.proveThreshold({
  did: participant_did,
  requiredScore: 600,
})

// Create a covenant
const covenant = await client.Covenant.create({
  schema: 'profit-share-v1',
  participants: [actor_did, funder_did],
  terms: covenant_terms,
})`}</pre>
          </div>
        </section>

        <div style={{ height: 1, background: '#1C1730', margin: '64px 0' }} />

        <section className="mb-24">
          <span className="section-label block mb-8">02 — Repositories</span>
          <h2 className="mb-8" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, color: '#E8E6F0', letterSpacing: '-0.01em' }}>github.com/zivana-labs</h2>
          <RepoGrid />
        </section>

        <div style={{ height: 1, background: '#1C1730', margin: '64px 0' }} />

        <section>
          <span className="section-label block mb-8">03 — Community</span>
          <h2 className="mb-5" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, color: '#E8E6F0', letterSpacing: '-0.01em' }}>Founding Contributor Programme</h2>
          <p className="mb-10" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', maxWidth: 560, lineHeight: 1.78 }}>
            Market traders, business owners, and community members who contribute price data to the Market Reporter Network during the build period earn a Founding Contributor credential. This credential unlocks priority access at launch, reduced protocol fees, and Agent eligibility.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:community@zivana.network" className="btn-primary" style={{ fontSize: 13 }}>Register interest</a>
            <a href="https://github.com/zivana-labs/.github/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize: 13 }}>Contributing guidelines</a>
          </div>
        </section>

      </div>
    </div>
  )
}