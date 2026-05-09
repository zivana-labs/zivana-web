'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { id: 'technical',  label: 'Technical',  color: '#7DD3FC', desc: 'Code, smart contracts, SDK, documentation' },
  { id: 'design',     label: 'Design',     color: '#C084FC', desc: 'Brand, UI/UX, illustrations, motion' },
  { id: 'community',  label: 'Community',  color: '#5EEAD4', desc: 'Market reporters, outreach, coordination' },
  { id: 'research',   label: 'Research',   color: '#FCD34D', desc: 'Protocol design, economic modelling, academic' },
  { id: 'operations', label: 'Operations', color: '#A78BFA', desc: 'Legal, finance, project management' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Register', desc: 'Submit your details and area of expertise. The core team reviews and activates your account.' },
  { step: '02', title: 'Pick a task', desc: 'Browse the open task board and claim a task that matches your skills and availability.' },
  { step: '03', title: 'Contribute', desc: 'Complete the work and submit your evidence. The core team reviews and verifies your contribution.' },
  { step: '04', title: 'Earn points', desc: 'Verified contributions earn points on the public leaderboard. Points convert to $ZVN at token launch.' },
]

export default function ContributePage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSending(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    })

    if (error) {
      setError(error.message)
      setSending(false)
      return
    }

    setSent(true)
    setSending(false)
  }

  return (
    <div className="bg-void min-h-screen">

      {/* Hero */}
      <section
        className="relative pt-40 pb-28 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#12092A 0%,#0D0B14 50%,#06020F 100%)' }}
      >
        {/* Orbs */}
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 600, height: 600, background: '#6D28D9', filter: 'blur(140px)', opacity: 0.08, top: -200, right: -100 }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 400, height: 400, background: '#4C1D95', filter: 'blur(120px)', opacity: 0.07, bottom: -100, left: '5%' }} />
        <div className="absolute inset-0 grid-overlay pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-8 lg:px-14 text-center">
          <span className="section-label block mb-6">Build Zivana</span>
          <h1
            className="mb-7"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(40px,6vw,80px)',
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              color: '#E8E6F0',
            }}
          >
            Build the protocol.<br />
            <span className="text-gradient">Own a piece of it.</span>
          </h1>
          <p
            className="mb-12 mx-auto"
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontWeight: 300,
              fontSize: 17,
              color: '#7B6FA8',
              maxWidth: 560,
              lineHeight: 1.78,
            }}
          >
            Zivana is being built in public by a global community. Every verified contribution earns points that convert proportionally to $ZVN tokens at launch. No salary. Equity in what you build.
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link href="/contribute/tasks" className="btn-primary">
              Browse open tasks
            </Link>
            <Link href="/contribute/leaderboard" className="btn-outline">
              View leaderboard
            </Link>
          </div>

          {/* Magic link sign in */}
          <div
            className="max-w-md mx-auto rounded-2xl border p-8"
            style={{ background: 'rgba(19,16,30,0.8)', borderColor: '#1C1730', backdropFilter: 'blur(20px)' }}
          >
            {sent ? (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.3)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 10l5 5L17 4" />
                  </svg>
                </div>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0' }}>
                  Check your email
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', textAlign: 'center', lineHeight: 1.65 }}>
                  We sent a sign in link to <span style={{ color: '#A78BFA' }}>{email}</span>. Click it to access your contributor dashboard.
                </p>
              </div>
            ) : (
              <>
                <p
                  className="mb-6"
                  style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}
                >
                  Sign in or register
                </p>
                <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#0D0B14',
                      border: '1px solid #1C1730',
                      borderRadius: 10,
                      color: '#E8E6F0',
                      fontFamily: 'Switzer, sans-serif',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                  {error && (
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#EF4444' }}>
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary w-full justify-center"
                    style={{ opacity: sending ? 0.7 : 1 }}
                  >
                    {sending ? 'Sending link...' : 'Send sign in link'}
                  </button>
                </form>
                <p
                  className="mt-4"
                  style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 11, color: '#8B7EC8', textAlign: 'center', lineHeight: 1.6 }}
                >
                  New contributors are reviewed by the core team before activation. Enter your email to get started.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 bg-void">
        <div className="max-w-6xl mx-auto px-8 lg:px-14">
          <span className="section-label block mb-6 text-center">How it works</span>
          <h2
            className="mb-16 text-center"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(28px,3.5vw,48px)',
              letterSpacing: '-0.025em',
              color: '#E8E6F0',
              lineHeight: 1.1,
            }}
          >
            Four steps from interest to equity
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((h, i) => (
              <div
                key={h.step}
                className="flex flex-col gap-4 p-7 rounded-2xl border"
                style={{
                  background: '#13101E',
                  borderColor: '#1C1730',
                  opacity: 0,
                  animation: `fadeUp 0.6s ease forwards ${i * 120 + 200}ms`,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Cabinet Grotesk, sans-serif',
                    fontWeight: 600,
                    fontSize: 36,
                    color: '#6B5FA0',
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {h.step}
                </span>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0' }}>
                  {h.title}
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.65 }}>
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contribution categories */}
      <section
        className="py-28"
        style={{ background: 'linear-gradient(180deg,#0D0B14,#100D1F)' }}
      >
        <div className="max-w-6xl mx-auto px-8 lg:px-14">
          <span className="section-label block mb-6 text-center">Contribution categories</span>
          <h2
            className="mb-6 text-center"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(28px,3.5vw,48px)',
              letterSpacing: '-0.025em',
              color: '#E8E6F0',
              lineHeight: 1.1,
            }}
          >
            Five ways to contribute
          </h2>
          <p
            className="mb-16 text-center mx-auto"
            style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', maxWidth: 480, lineHeight: 1.75 }}
          >
            Every category has predefined point ranges. The core team confirms the final score within that range based on quality and impact.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-4 p-6 rounded-2xl border"
                style={{
                  background: '#13101E',
                  borderColor: '#1C1730',
                  transition: 'border-color 0.3s, transform 0.3s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = c.color + '60'
                  el.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = '#1C1730'
                  el.style.transform = 'translateY(0)'
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: c.color + '18', border: `1px solid ${c.color}35` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                </div>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>
                  {c.label}
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12, color: '#7B6FA8', lineHeight: 1.6 }}>
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Point ranges */}
      <section className="py-28 bg-void">
        <div className="max-w-4xl mx-auto px-8 lg:px-14">
          <span className="section-label block mb-6 text-center">Point system</span>
          <h2
            className="mb-6 text-center"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(28px,3.5vw,48px)',
              letterSpacing: '-0.025em',
              color: '#E8E6F0',
              lineHeight: 1.1,
            }}
          >
            Transparent by design
          </h2>
          <p
            className="mb-16 text-center mx-auto"
            style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', maxWidth: 480, lineHeight: 1.75 }}
          >
            Every point range is public before you start. No surprises after delivery.
          </p>

          <div className="flex flex-col gap-3">
            {[
              { category: 'Technical',  small: '50-120', medium: '150-280', large: '300-500', color: '#7DD3FC' },
              { category: 'Design',     small: '30-80',  medium: '80-160',  large: '180-300', color: '#C084FC' },
              { category: 'Research',   small: '50-100', medium: '100-200', large: '200-400', color: '#FCD34D' },
              { category: 'Operations', small: '30-60',  medium: '80-150',  large: '150-200', color: '#A78BFA' },
              { category: 'Community',  small: '10-30',  medium: '60-120',  large: '100-150', color: '#5EEAD4' },
            ].map((r) => (
              <div
                key={r.category}
                className="grid grid-cols-4 gap-4 p-5 rounded-xl border items-center"
                style={{ background: '#13101E', borderColor: '#1C1730' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                  <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: '#E8E6F0' }}>
                    {r.category}
                  </span>
                </div>
                {[
                  { label: 'Small', value: r.small },
                  { label: 'Medium', value: r.medium },
                  { label: 'Large', value: r.large },
                ].map((c) => (
                  <div key={c.label} className="flex flex-col gap-1">
                    <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 9, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8B7EC8' }}>
                      {c.label}
                    </span>
                    <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: r.color }}>
                      {c.value} pts
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Multipliers */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="p-6 rounded-xl border" style={{ background: '#0F0D1A', borderColor: '#1E1640' }}>
              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#A78BFA', marginBottom: 6 }}>
                Consistency multiplier — 1.2x
              </p>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.65 }}>
                Applied automatically when you complete five or more verified contributions. Rewards sustained commitment over one-off work.
              </p>
            </div>
            <div className="p-6 rounded-xl border" style={{ background: '#0F0D1A', borderColor: '#1E1640' }}>
              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#A78BFA', marginBottom: 6 }}>
                Quality multiplier — 1.5x
              </p>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#7B6FA8', lineHeight: 1.65 }}>
                Awarded by the core team for exceptional contributions. Applied sparingly and always accompanied by a written note.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-28 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#0D0B14,#12092A)' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ width: 600, height: 400, background: 'radial-gradient(ellipse,rgba(109,40,217,0.12) 0%,transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
        />
        <div className="relative z-10 max-w-xl mx-auto px-8 lg:px-14">
          <h2
            className="mb-5"
            style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 'clamp(28px,4vw,52px)', letterSpacing: '-0.025em', color: '#E8E6F0', lineHeight: 1.1 }}
          >
            Ready to build?
          </h2>
          <p
            className="mb-10"
            style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 16, color: '#7B6FA8', lineHeight: 1.78 }}
          >
            Browse the open task board to see what needs building right now.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contribute/tasks" className="btn-primary">Browse tasks</Link>
            <Link href="/contribute/leaderboard" className="btn-outline">View leaderboard</Link>
          </div>
        </div>
      </section>

    </div>
  )
}