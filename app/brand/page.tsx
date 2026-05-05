import type { Metadata } from 'next'
import Logo from '@/components/logo/Logo'
import { COLOURS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Brand — Zivana Protocol',
  description: 'The Zivana Protocol brand guidelines.',
}

export default function BrandPage() {
  return (
    <div className="pt-36 pb-44 bg-void min-h-screen">
      <div className="max-w-5xl mx-auto px-8 lg:px-14">

        {/* Header */}
        <div className="mb-28">
          <span className="section-label block mb-7">Brand Guidelines</span>
          <h1 className="mb-8" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(44px,7vw,88px)', letterSpacing: '-0.03em', lineHeight: 1.0, color: '#E8E6F0' }}>
            Brand<br />
            <span className="text-gradient">Guidelines.</span>
          </h1>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 17, color: '#7B6FA8', maxWidth: 520, lineHeight: 1.78 }}>
            Version 1.0 — The visual and verbal identity of the Zivana Protocol. Every decision here is intentional and must be applied consistently across all surfaces.
          </p>
        </div>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 96 }} />

        {/* 1.0 The Mark */}
        <section className="mb-28">
          <span className="section-label block mb-3">1.0</span>
          <h2 className="mb-16" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(36px,5vw,72px)', letterSpacing: '-0.03em', lineHeight: 1.0, color: '#E8E6F0' }}>
            Brand Logo.
          </h2>

          {/* Mission statement */}
          <div className="mb-20 p-12 rounded-2xl border" style={{ background: '#0F0D1A', borderColor: '#1C1730' }}>
            <span className="section-label block mb-6">Zivana Mission Statement</span>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 'clamp(18px,2.5vw,28px)', color: '#E8E6F0', lineHeight: 1.65, maxWidth: 680 }}>
              Trust infrastructure for the African informal economy. Making economic capability visible, verifiable, and financeable without requiring informal actors to become formal first.
            </p>
          </div>

          {/* Primary logo */}
          <div className="mb-6">
            <span className="section-label block mb-6">Primary Logo</span>
            <p className="mb-8" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', maxWidth: 380, lineHeight: 1.72 }}>
              The horizontal lockup is the primary configuration. Use it for all external-facing applications to establish brand recognition.
            </p>
            <div className="p-16 rounded-2xl border flex items-center justify-center" style={{ background: '#0F0D1A', borderColor: '#1C1730' }}>
              <Logo config="horizontal" size={1.4} />
            </div>
          </div>

          {/* Secondary logo */}
          <div className="mb-6">
            <span className="section-label block mb-6">Secondary Logo — Stacked</span>
            <p className="mb-8" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', maxWidth: 380, lineHeight: 1.72 }}>
              Use the stacked configuration in square or vertical contexts: splash screens, social media posts, and printed materials.
            </p>
            <div className="p-16 rounded-2xl border flex items-center justify-center" style={{ background: '#0F0D1A', borderColor: '#1C1730' }}>
              <Logo config="stacked" size={1.4} />
            </div>
          </div>

          {/* Icon only */}
          <div className="mb-6">
            <span className="section-label block mb-6">Icon Mark — Isolated</span>
            <p className="mb-8" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', maxWidth: 380, lineHeight: 1.72 }}>
              Use the icon mark alone only when the Zivana brand is already established in context: app icons, favicons, and social avatars.
            </p>
            <div className="p-16 rounded-2xl border flex items-center justify-center" style={{ background: '#0F0D1A', borderColor: '#1C1730' }}>
              <Logo config="icon" size={2} />
            </div>
          </div>

          {/* Formal context */}
          <div className="mb-20">
            <span className="section-label block mb-6">Formal Context — With Protocol Sub-label</span>
            <p className="mb-8" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', maxWidth: 380, lineHeight: 1.72 }}>
              The PROTOCOL sub-label appears in formal contexts only: official documents, presentations, and regulatory materials.
            </p>
            <div className="p-16 rounded-2xl border flex items-center justify-center" style={{ background: '#0F0D1A', borderColor: '#1C1730' }}>
              <Logo config="horizontal" size={1.4} showProtocol />
            </div>
          </div>

          {/* Mark concept */}
          <div className="p-8 rounded-xl border mb-12" style={{ background: '#13101E', borderColor: '#1E1640' }}>
            <h3 className="mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: '#E8E6F0' }}>The Emergence</h3>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.72, maxWidth: 560 }}>
              Three concentric arcs opening upward from a single apex point. The arcs represent trust expanding outward: from one person, to their immediate community, to the world. The apex dot is the moment of emergence — the instant that invisible economic capability becomes legible. The mark is simple enough to read at 16 pixels and carries no cultural baggage.
            </p>
          </div>

          {/* Wrong usage */}
          <div className="mb-6">
            <span className="section-label block mb-8">Wrong Usage</span>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Never rotate or distort the mark in any dimension',
                'Never add drop shadows, glows, or outlines to the mark',
                'Never change the arc opacity ratios (100%, 62%, 32%)',
                'Never use the mark on a background below minimum contrast',
                'Never separate the wordmark from the mark in Config 01',
                'Never recreate the mark — always use the master SVG file',
              ].map((rule) => (
                <div key={rule} className="flex gap-3 items-start p-4 rounded-xl border" style={{ background: 'rgba(146,34,33,0.06)', borderColor: 'rgba(146,34,33,0.2)' }}>
                  <span style={{ color: '#EF4444', fontSize: 14, flexShrink: 0, lineHeight: 1.5 }}>✗</span>
                  <span style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.6 }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 96 }} />

        {/* 2.0 Typography */}
        <section className="mb-28">
          <span className="section-label block mb-3">2.0</span>
          <h2 className="mb-16" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(36px,5vw,72px)', letterSpacing: '-0.03em', lineHeight: 1.0, color: '#E8E6F0' }}>
            Brand Typography.
          </h2>

          {/* Syne specimen */}
          <div className="mb-6 p-12 rounded-2xl border" style={{ background: '#0F0D1A', borderColor: '#1C1730' }}>
            <div className="grid lg:grid-cols-4 gap-8 items-start">
              <div>
                <span className="section-label block mb-3">Primary Typeface</span>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.7 }}>
                  Syne is used for all display and heading contexts. Bold, geometric, and built for density.
                </p>
              </div>
              <div className="lg:col-span-3">
                <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(48px,7vw,96px)', color: '#E8E6F0', lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 24 }}>
                  Syne.
                </div>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: '#7B6FA8', letterSpacing: '0.02em' }}>
                  700 Regular &amp; 800 ExtraBold
                </p>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#4A3E7A', marginTop: 12, letterSpacing: '0.04em' }}>
                  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
                </p>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#4A3E7A', marginTop: 4, letterSpacing: '0.04em' }}>
                  a b c d e f g h i j k l m n o p q r s t u v w x y z
                </p>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#4A3E7A', marginTop: 4, letterSpacing: '0.04em' }}>
                  1 2 3 4 5 6 7 8 9 0
                </p>
              </div>
            </div>
          </div>

          {/* DM Sans specimen */}
          <div className="mb-16 p-12 rounded-2xl border" style={{ background: '#0F0D1A', borderColor: '#1C1730' }}>
            <div className="grid lg:grid-cols-4 gap-8 items-start">
              <div>
                <span className="section-label block mb-3">Secondary Typeface</span>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.7 }}>
                  DM Sans carries the human voice in body copy. Warm, legible, accessible at small sizes.
                </p>
              </div>
              <div className="lg:col-span-3">
                <div style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 'clamp(48px,7vw,96px)', color: '#E8E6F0', lineHeight: 0.95, letterSpacing: '-0.02em', marginBottom: 24 }}>
                  DM Sans.
                </div>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 400, fontSize: 18, color: '#7B6FA8' }}>
                  300 Light, 400 Regular &amp; 500 Medium
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#4A3E7A', marginTop: 12 }}>
                  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#4A3E7A', marginTop: 4 }}>
                  a b c d e f g h i j k l m n o p q r s t u v w x y z
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#4A3E7A', marginTop: 4 }}>
                  1 2 3 4 5 6 7 8 9 0
                </p>
              </div>
            </div>
          </div>

          {/* Typography hierarchy */}
          <span className="section-label block mb-8">Typography Hierarchy</span>
          <div className="flex flex-col" style={{ borderTop: '1px solid #1C1730' }}>
            {[
              { role: 'Display', spec: 'Syne 800 — clamp(56px, 8vw, 100px) — tracking -0.03em', sample: 'Trust Made Visible', size: 48 },
              { role: 'Heading 1', spec: 'Syne 800 — clamp(36px, 5vw, 72px) — tracking -0.025em', sample: 'Open Protocol Infrastructure', size: 36 },
              { role: 'Heading 2', spec: 'Syne 700 — clamp(24px, 3vw, 48px) — tracking -0.02em', sample: 'Five Core Primitives', size: 26 },
              { role: 'Body Lead', spec: 'DM Sans 300 — 16-19px — leading 1.78', sample: 'Making economic capability visible, verifiable, and financeable.', size: 17 },
              { role: 'Body', spec: 'DM Sans 300 — 13-15px — leading 1.72', sample: 'The protocol exposes five primitives. Every application chooses which ones to use.', size: 14 },
              { role: 'Label', spec: 'DM Sans 500 — 10-11px — tracking 0.2em — UPPERCASE', sample: 'PROTOCOL PRIMITIVE', size: 10 },
            ].map((t) => (
              <div key={t.role} className="grid grid-cols-5 gap-6 py-6 items-baseline" style={{ borderBottom: '1px solid #1C1730' }}>
                <div className="col-span-1">
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 12, color: '#7B6FA8' }}>{t.role}</p>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 10, color: '#4A3E7A', marginTop: 3, lineHeight: 1.5 }}>{t.spec}</p>
                </div>
                <div className="col-span-4">
                  <span
                    style={{
                      fontFamily: t.role === 'Label' ? 'Switzer, sans-serif' : t.role.startsWith('Heading') || t.role === 'Display' ? 'Cabinet Grotesk, sans-serif' : 'Switzer, sans-serif',
                      fontWeight: t.role === 'Label' ? 500 : t.role === 'Body Lead' || t.role === 'Body' ? 300 : 800,
                      fontSize: t.size,
                      color: '#E8E6F0',
                      letterSpacing: t.role === 'Label' ? '0.2em' : t.role === 'Display' ? '-0.03em' : '-0.01em',
                      textTransform: t.role === 'Label' ? 'uppercase' : 'none',
                      lineHeight: 1.2,
                    }}
                  >
                    {t.sample}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 96 }} />

        {/* 3.0 Colour */}
        <section className="mb-28">
          <span className="section-label block mb-3">3.0</span>
          <h2 className="mb-16" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(36px,5vw,72px)', letterSpacing: '-0.03em', lineHeight: 1.0, color: '#E8E6F0' }}>
            Brand Colors.
          </h2>

          <span className="section-label block mb-8">Primary Colors</span>
          <p className="mb-10" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', maxWidth: 480, lineHeight: 1.72 }}>
            Our primary colours represent the core identity of the brand. Deep purple is the foundation. The full spectrum from void to light creates depth and hierarchy.
          </p>

          {/* Colour cards */}
          <div className="grid grid-cols-3 gap-4 mb-16">
            {COLOURS.map((c) => {
              const r = parseInt(c.hex.slice(1, 3), 16)
              const g = parseInt(c.hex.slice(3, 5), 16)
              const b = parseInt(c.hex.slice(5, 7), 16)
              const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
              const tc = lum > 0.45 ? '#13101E' : '#E8E6F0'
              const tcMute = lum > 0.45 ? 'rgba(13,11,20,0.55)' : 'rgba(232,230,240,0.45)'
              return (
                <div key={c.hex} className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  <div
                    style={{ height: 140, background: c.hex, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px 16px 14px' }}
                  >
                    <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: tc, lineHeight: 1.2 }}>{c.name}</p>
                    <p style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: tcMute, marginTop: 3 }}>{c.hex}</p>
                  </div>
                  <div style={{ background: '#13101E', padding: '12px 16px' }}>
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 11, color: '#4A3E7A', lineHeight: 1.5 }}>{c.usage}</p>
                    <p style={{ fontFamily: 'Courier New, monospace', fontSize: 10, color: '#2D2450', marginTop: 3 }}>rgb({c.rgb})</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Gradient */}
          <span className="section-label block mb-8">Primary Gradient</span>
          <p className="mb-8" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', maxWidth: 480, lineHeight: 1.72 }}>
            The brand gradient is a signature visual element. It must always retain its original direction, blend, and proportion to ensure recognisability.
          </p>
          <div className="rounded-2xl overflow-hidden mb-16" style={{ height: 260 }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(135deg,#A78BFA 0%,#6D28D9 50%,#4C1D95 100%)',
                display: 'flex',
                alignItems: 'flex-start',
                padding: 28,
                gap: 40,
              }}
            >
              {[
                { pos: 'top left', hex: '#A78BFA' },
                { pos: 'centre', hex: '#6D28D9' },
                { pos: 'bottom right', hex: '#4C1D95' },
              ].map((p) => (
                <div key={p.hex} className="flex flex-col gap-1">
                  <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.6)', background: 'transparent' }} />
                  <span style={{ fontFamily: 'Courier New, monospace', fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Hex: {p.hex}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div style={{ height: 1, background: '#1C1730', marginBottom: 96 }} />

        {/* Voice and Tone */}
        <section className="mb-28">
          <span className="section-label block mb-3">4.0</span>
          <h2 className="mb-16" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(36px,5vw,72px)', letterSpacing: '-0.03em', lineHeight: 1.0, color: '#E8E6F0' }}>
            Voice and Tone.
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {[
              { trait: 'Direct', desc: 'Say what it does. Not what it might do, or what it could potentially enable.' },
              { trait: 'Honest', desc: 'Acknowledge early-stage realities. The documentation says "coming in Phase 2" not "coming soon".' },
              { trait: 'Grounded', desc: 'Every claim roots in the real world. No speculation language. Value tied to action, not aspiration.' },
              { trait: 'Human', desc: 'Economic actors are not "users". The communities this protocol serves are named precisely, not abstracted.' },
            ].map((v) => (
              <div key={v.trait} className="p-6 rounded-xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#A78BFA', marginBottom: 6 }}>{v.trait}</p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13.5, color: '#7B6FA8', lineHeight: 1.68 }}>{v.desc}</p>
              </div>
            ))}
          </div>

          <span className="section-label block mb-6">Do / Don&apos;t Examples</span>
          <div className="flex flex-col gap-4">
            {[
              {
                do: 'A trader in Lagos with five years of consistent sales history can now demonstrate that to a capital provider in London through a verifiable trust profile she owns and controls.',
                dont: 'Zivana leverages cutting-edge blockchain technology to empower underserved communities through decentralised financial inclusion solutions.',
              },
              {
                do: 'The covenant executes. Value distributes. No human intervention required at any step.',
                dont: 'Our revolutionary smart contract technology automatically processes transactions in a fully autonomous and trustless manner.',
              },
            ].map((e, i) => (
              <div key={i} className="grid sm:grid-cols-2 gap-3">
                <div className="p-5 rounded-xl" style={{ background: 'rgba(6,95,70,0.1)', border: '1px solid rgba(6,95,70,0.2)' }}>
                  <p className="mb-2" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#10B981' }}>Write this</p>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#6EE7B7', lineHeight: 1.68 }}>{e.do}</p>
                </div>
                <div className="p-5 rounded-xl" style={{ background: 'rgba(127,29,29,0.1)', border: '1px solid rgba(127,29,29,0.2)' }}>
                  <p className="mb-2" style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#EF4444' }}>Not this</p>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#FCA5A5', lineHeight: 1.68 }}>{e.dont}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 rounded-xl border" style={{ background: '#13101E', borderColor: '#1E1640' }}>
            <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#A78BFA', marginBottom: 6 }}>Punctuation rule</p>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13.5, color: '#7B6FA8', lineHeight: 1.68 }}>
              Never use em dashes. Use a colon, a comma, or a period instead. This rule applies to all brand communications, documentation, social media, and internal materials without exception.
            </p>
          </div>
        </section>

        {/* Closing */}
        <div
          className="p-12 rounded-2xl text-center"
          style={{ background: 'linear-gradient(135deg,#12092A,#0D0B14)', border: '1px solid #1C1730' }}
        >
          <Logo config="stacked" size={1.0} className="mb-8 mx-auto" />
          <p className="section-label mb-3">Zivana Brand Guidelines v1.0</p>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#4A3E7A' }}>
            Questions about brand usage: brand@zivana.network
          </p>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12, color: '#2D2450', marginTop: 6 }}>
            Built in Lagos. Open to the world.
          </p>
        </div>

      </div>
    </div>
  )
}