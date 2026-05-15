'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = [
  { id: 'technical',  label: 'Technical',  desc: 'Code, smart contracts, SDK, documentation' },
  { id: 'design',     label: 'Design',     desc: 'Brand, UI/UX, illustrations, motion' },
  { id: 'community',  label: 'Community',  desc: 'Market reporters, outreach, coordination' },
  { id: 'research',   label: 'Research',   desc: 'Protocol design, economic modelling, academic' },
  { id: 'operations', label: 'Operations', desc: 'Legal, finance, project management' },
]

const TIMEZONES = [
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Accra',
  'Africa/Johannesburg',
  'Africa/Cairo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Singapore',
]

const AVAILABILITY = [
  { value: 2,  label: '1-2 hours per week' },
  { value: 5,  label: '3-5 hours per week' },
  { value: 10, label: '6-10 hours per week' },
  { value: 20, label: '10-20 hours per week' },
  { value: 40, label: 'Full time (20+ hours)' },
]

type Step = 1 | 2 | 3

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    // Step 1 — Identity
    name: '',
    email: '',
    contributor_type: 'individual',
    team_name: '',
    location: '',
    timezone: 'Africa/Lagos',
    // Step 2 — Expertise
    categories: [] as string[],
    skills: '',
    availability_hours_per_week: 5,
    bio: '',
    // Step 3 — Links
    github_handle: '',
    twitter_handle: '',
    linkedin_url: '',
    portfolio_url: '',
    wallet_address: '',
    // Step 3 — Notifications
    notification_email: true,
    notification_telegram: false,
  })

  function update(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function canProceedStep1() {
    return form.name.trim() &&
      form.email.trim() &&
      form.location.trim() &&
      (form.contributor_type === 'individual' || form.team_name.trim())
  }

  function canProceedStep2() {
    return form.categories.length > 0 && form.bio.trim()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const supabase = createClient()

    // Wait for session to be available — handles implicit flow token restoration delay
    let { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Session may not be restored yet — wait for auth state change
      user = await new Promise((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            subscription.unsubscribe()
            resolve(session.user)
          }
        })
        // Timeout after 3 seconds
        setTimeout(() => {
          subscription.unsubscribe()
          resolve(null)
        }, 3000)
      })
    }

    if (!user) {
      setError('Session expired. Please sign in again before submitting.')
      setSubmitting(false)
      return
    }

    const skillsArray = form.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    // Check if contributor already exists with revision_requested status
    const { data: existing } = await supabase
      .from('contributors')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    const isResubmission = existing?.status === 'revision_requested'

    const payload = {
      user_id: user?.id ?? null,
      name: form.name.trim(),
      email: user?.email ?? form.email.trim().toLowerCase(),
      contributor_type: form.contributor_type,
      team_name: form.team_name.trim() || null,
      location: form.location.trim(),
      timezone: form.timezone,
      categories: form.categories,
      skills: skillsArray.length > 0 ? skillsArray : null,
      availability_hours_per_week: form.availability_hours_per_week,
      bio: form.bio.trim(),
      github_handle: form.github_handle.trim() || null,
      twitter_handle: form.twitter_handle.trim() || null,
      linkedin_url: form.linkedin_url.trim() || null,
      portfolio_url: form.portfolio_url.trim() || null,
      wallet_address: form.wallet_address.trim() || null,
      notification_email: form.notification_email,
      notification_telegram: form.notification_telegram,
      status: 'pending',
      ...(isResubmission && { revision_notes: null }),
    }

    let insertError
    if (isResubmission && existing?.id) {
      const { error } = await supabase
        .from('contributors')
        .update(payload)
        .eq('id', existing.id)
      insertError = error
    } else {
      const { error } = await supabase
        .from('contributors')
        .insert(payload)
      insertError = error
    }

    if (insertError) {
      console.error('Insert error full:', JSON.stringify(insertError))
      if (insertError.code === '23505') {
        setError('This email is already registered. Sign in from the contribute page.')
      } else if (insertError.code === '42501') {
        setError('Registration is currently restricted. Please contact the core team at community@zivana.network.')
      } else if (insertError.message?.includes('row-level security')) {
        setError('Registration is currently restricted. Please contact the core team at community@zivana.network.')
      } else {
        setError(`Registration failed: ${insertError.message}. Please contact community@zivana.network if this persists.`)
      }
      setSubmitting(false)
      return
    }

    // Send magic link to verify email and link user_id to contributor record
    await supabase.auth.signInWithOtp({
      email: form.email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/contribute/dashboard`,
        shouldCreateUser: true,
      },
    })

    setSubmitted(true)
    setSubmitting(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    background: '#0D0B14',
    border: '1px solid #1C1730',
    borderRadius: 8,
    color: '#E8E6F0',
    fontFamily: 'Switzer, sans-serif',
    fontSize: 13,
    outline: 'none',
  }

  const labelStyle = {
    fontFamily: 'Switzer, sans-serif',
    fontSize: 11,
    color: '#8B7EC8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: 6,
  }

  if (submitted) {
    return (
      <div className="bg-void min-h-screen pt-36 pb-28 flex items-start justify-center">
        <div className="max-w-lg w-full mx-auto px-8 lg:px-14 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
            style={{ background: 'rgba(109,40,217,0.12)', border: '1px solid rgba(109,40,217,0.25)' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 16l8 8L27 8" />
            </svg>
          </div>
          <h2
            className="mb-4"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: '-0.02em',
              color: '#E8E6F0',
            }}
          >
            Check your email
          </h2>
          <p
            className="mb-4"
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontWeight: 300,
              fontSize: 16,
              color: '#7B6FA8',
              lineHeight: 1.78,
            }}
          >
            Your application has been received. We sent a verification link to <span style={{ color: '#A78BFA' }}>{form.email}</span> — click it to verify your email address.
          </p>
          <p
            className="mb-10"
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontWeight: 300,
              fontSize: 13,
              color: '#8B7EC8',
              lineHeight: 1.7,
            }}
          >
            After verifying your email you will see your application status. The core team reviews all applications before activation — you will be notified when your account is approved.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contribute/tasks" className="btn-primary">
              Browse tasks
            </Link>
            <Link href="/contribute/leaderboard" className="btn-outline">
              View leaderboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-void min-h-screen pt-36 pb-28">
      <div className="max-w-2xl mx-auto px-8 lg:px-14">

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/contribute"
              style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8', textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#7B6FA8')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#8B7EC8')}
            >
              Contribute
            </Link>
            <span style={{ color: '#6B5FA0' }}>/</span>
            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#7B6FA8' }}>Register</span>
          </div>
          <h1
            className="mb-3"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 'clamp(28px,4vw,52px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.08,
              color: '#E8E6F0',
            }}
          >
            Contributor registration
          </h1>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', lineHeight: 1.75 }}>
            Tell us about yourself and your area of expertise. The core team reviews all applications before activation.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-10">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  background: step === s
                    ? 'linear-gradient(135deg,#A78BFA,#6D28D9)'
                    : step > s
                    ? 'rgba(109,40,217,0.2)'
                    : '#13101E',
                  border: `1px solid ${step >= s ? '#6D28D9' : '#1C1730'}`,
                  transition: 'all 0.3s',
                }}
              >
                {step > s ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 12, color: step === s ? 'white' : '#8B7EC8' }}>
                    {s}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: step === s ? '#A78BFA' : '#8B7EC8' }}>
                {s === 1 ? 'Identity' : s === 2 ? 'Expertise' : 'Links'}
              </span>
              {s < 3 && (
                <div style={{ width: 32, height: 1, background: step > s ? '#6D28D9' : '#1C1730', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            className="p-8 rounded-2xl border"
            style={{ background: '#13101E', borderColor: '#1C1730' }}
          >

            {/* Step 1 — Identity */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0', marginBottom: 4 }}>
                  Tell us who you are
                </p>

                {/* Contributor type */}
                <div>
                  <label style={labelStyle}>Contributor type</label>
                  <div className="flex gap-3">
                    {['individual', 'team'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => update('contributor_type', t)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 8,
                          border: `1px solid ${form.contributor_type === t ? '#6D28D9' : '#1C1730'}`,
                          background: form.contributor_type === t ? 'rgba(109,40,217,0.12)' : '#0D0B14',
                          color: form.contributor_type === t ? '#A78BFA' : '#8B7EC8',
                          fontFamily: 'Switzer, sans-serif',
                          fontSize: 13,
                          fontWeight: 500,
                          textTransform: 'capitalize',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>
                      {form.contributor_type === 'team' ? 'Your name' : 'Full name'}
                    </label>
                    <input
                      type="text"
                      placeholder="Adunola Fashola"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      required
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                      onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      required
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                      onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                    />
                  </div>
                </div>

                {form.contributor_type === 'team' && (
                  <div>
                    <label style={labelStyle}>Team name</label>
                    <input
                      type="text"
                      placeholder="Lagos Dev Collective"
                      value={form.team_name}
                      onChange={(e) => update('team_name', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                      onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                    />
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Location</label>
                    <input
                      type="text"
                      placeholder="Lagos, Nigeria"
                      value={form.location}
                      onChange={(e) => update('location', e.target.value)}
                      required
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                      onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Timezone</label>
                    <select
                      value={form.timezone}
                      onChange={(e) => update('timezone', e.target.value)}
                      style={inputStyle}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1()}
                  className="btn-primary justify-center"
                  style={{ opacity: canProceedStep1() ? 1 : 0.4, marginTop: 8 }}
                >
                  Continue to expertise
                </button>
              </div>
            )}

            {/* Step 2 — Expertise */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0', marginBottom: 4 }}>
                  What do you bring?
                </p>

                {/* Category */}
                <div>
                  <label style={labelStyle}>
                    Categories{' '}
                    <span style={{ textTransform: 'none', letterSpacing: 0, color: '#6B5FA0' }}>
                      (select up to 2)
                    </span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {CATEGORIES.map((c) => {
                      const selected = form.categories.includes(c.id)
                      const maxReached = form.categories.length >= 2 && !selected
                      return (
                        <button
                          key={c.id}
                          type="button"
                          disabled={maxReached}
                          onClick={() => {
                            if (selected) {
                              update('categories', form.categories.filter((x: string) => x !== c.id) as any)
                            } else if (!maxReached) {
                              update('categories', [...form.categories, c.id] as any)
                            }
                          }}
                          className="flex items-start gap-3 p-4 rounded-xl border text-left"
                          style={{
                            background: selected ? 'rgba(109,40,217,0.1)' : '#0D0B14',
                            borderColor: selected ? '#6D28D9' : '#1C1730',
                            cursor: maxReached ? 'not-allowed' : 'pointer',
                            opacity: maxReached ? 0.4 : 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          <div
                            className="flex-shrink-0 mt-0.5"
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 3,
                              border: `2px solid ${selected ? '#6D28D9' : '#6B5FA0'}`,
                              background: selected ? '#6D28D9' : 'transparent',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {selected && (
                              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M1 4l2 2 4-4" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: selected ? '#A78BFA' : '#E8E6F0', marginBottom: 2 }}>
                              {c.label}
                            </p>
                            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 11.5, color: '#7B6FA8', lineHeight: 1.5 }}>
                              {c.desc}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {form.categories.length === 2 && (
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', marginTop: 8, lineHeight: 1.5 }}>
                      Maximum reached. To change categories later contact the core team.
                    </p>
                  )}
                </div>

                {/* Skills */}
                <div>
                  <label style={labelStyle}>
                    Skills <span style={{ textTransform: 'none', letterSpacing: 0, color: '#6B5FA0' }}>(comma separated)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Aiken, TypeScript, Cardano, React..."
                    value={form.skills}
                    onChange={(e) => update('skills', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                </div>

                {/* Availability */}
                <div>
                  <label style={labelStyle}>Availability</label>
                  <select
                    value={form.availability_hours_per_week}
                    onChange={(e) => update('availability_hours_per_week', Number(e.target.value))}
                    style={inputStyle}
                  >
                    {AVAILABILITY.map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>

                {/* Bio */}
                <div>
                  <label style={labelStyle}>Bio</label>
                  <textarea
                    placeholder="Tell us about your background, what you have built, and why you want to contribute to Zivana."
                    value={form.bio}
                    onChange={(e) => update('bio', e.target.value)}
                    required
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-outline"
                    style={{ fontSize: 13 }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2()}
                    className="btn-primary flex-1 justify-center"
                    style={{ opacity: canProceedStep2() ? 1 : 0.4 }}
                  >
                    Continue to links
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Links */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0', marginBottom: 4 }}>
                  Where can we find your work?
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#8B7EC8', lineHeight: 1.65, marginTop: -8 }}>
                  All fields are optional but help the core team review your application faster.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>GitHub handle</label>
                    <input
                      type="text"
                      placeholder="yourhandle"
                      value={form.github_handle}
                      onChange={(e) => update('github_handle', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                      onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Twitter / X handle</label>
                    <input
                      type="text"
                      placeholder="yourhandle"
                      value={form.twitter_handle}
                      onChange={(e) => update('twitter_handle', e.target.value)}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                      onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>LinkedIn URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={form.linkedin_url}
                    onChange={(e) => update('linkedin_url', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Portfolio URL</label>
                  <input
                    type="url"
                    placeholder="https://yourportfolio.com"
                    value={form.portfolio_url}
                    onChange={(e) => update('portfolio_url', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Wallet address <span style={{ textTransform: 'none', letterSpacing: 0, color: '#6B5FA0' }}>(Cardano, optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="addr1..."
                    value={form.wallet_address}
                    onChange={(e) => update('wallet_address', e.target.value)}
                    style={{ ...inputStyle, fontFamily: 'Courier New, monospace', fontSize: 12 }}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#6B5FA0', marginTop: 5, lineHeight: 1.5 }}>
                    You can add or update this later. Required at token distribution time only.
                  </p>
                </div>

                {/* Notification preferences */}
                <div>
                  <label style={labelStyle}>
                    Reminder notifications
                  </label>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8', marginBottom: 10, lineHeight: 1.6 }}>
                    Choose how you want to receive deadline reminders for claimed tasks.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => update('notification_email', !form.notification_email)}
                      className="flex items-center gap-3 p-4 rounded-xl border text-left"
                      style={{
                        background: form.notification_email ? 'rgba(109,40,217,0.1)' : '#0D0B14',
                        borderColor: form.notification_email ? '#6D28D9' : '#1C1730',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: `2px solid ${form.notification_email ? '#6D28D9' : '#2D2450'}`,
                          background: form.notification_email ? '#6D28D9' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.2s',
                        }}
                      >
                        {form.notification_email && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <path d="M1.5 5l2.5 2.5 4.5-5" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: form.notification_email ? '#A78BFA' : '#E8E6F0', marginBottom: 2 }}>
                          Email reminders
                        </p>
                        <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 11.5, color: '#7B6FA8', lineHeight: 1.5 }}>
                          Receive deadline reminders at your registered email address via Brevo
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => update('notification_telegram', !form.notification_telegram)}
                      className="flex items-center gap-3 p-4 rounded-xl border text-left"
                      style={{
                        background: form.notification_telegram ? 'rgba(109,40,217,0.1)' : '#0D0B14',
                        borderColor: form.notification_telegram ? '#6D28D9' : '#1C1730',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: `2px solid ${form.notification_telegram ? '#6D28D9' : '#2D2450'}`,
                          background: form.notification_telegram ? '#6D28D9' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.2s',
                        }}
                      >
                        {form.notification_telegram && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <path d="M1.5 5l2.5 2.5 4.5-5" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: form.notification_telegram ? '#A78BFA' : '#E8E6F0', marginBottom: 2 }}>
                          Telegram reminders
                        </p>
                        <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 11.5, color: '#7B6FA8', lineHeight: 1.5 }}>
                          Connect your Telegram account after registration to receive reminders there
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    className="p-4 rounded-xl border"
                    style={{ background: 'rgba(127,29,29,0.1)', borderColor: 'rgba(127,29,29,0.3)' }}
                  >
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#FCA5A5' }}>{error}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-outline"
                    style={{ fontSize: 13 }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex-1 justify-center"
                    style={{ opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? 'Submitting...' : 'Submit application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Note */}
        <div
          className="mt-6 p-5 rounded-xl border"
          style={{ background: '#0F0D1A', borderColor: '#1E1640' }}
        >
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12, color: '#8B7EC8', lineHeight: 1.65 }}>
            Already registered? <Link href="/contribute" style={{ color: '#6D28D9', textDecoration: 'none' }}>Sign in from the contribute page</Link> using your email address.
          </p>
        </div>

      </div>
    </div>
  )
}