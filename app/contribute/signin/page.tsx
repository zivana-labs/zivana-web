'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, createClient } from '@/lib/supabase/client'
import Logo from '@/components/logo/Logo'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [showSignup, setShowSignup] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')
  const [signupSending, setSignupSending] = useState(false)
  const [signupSent, setSignupSent] = useState(false)
  const [signupError, setSignupError] = useState('')

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSending(true)
    setError('')

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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!signupEmail.trim()) return
    setSignupSending(true)
    setSignupError('')

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: signupEmail.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: true,
      },
    })

    if (otpError) {
      setSignupError('Failed to send link. Please try again.')
      setSignupSending(false)
      return
    }

    setSignupSent(true)
    setSignupSending(false)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: 'linear-gradient(135deg,#12092A 0%,#0D0B14 50%,#06020F 100%)',
      }}
    >
      {/* Background orbs */}
      <div
        className="fixed rounded-full pointer-events-none"
        style={{ width: 600, height: 600, background: '#6D28D9', filter: 'blur(140px)', opacity: 0.07, top: -200, right: -100 }}
      />
      <div
        className="fixed rounded-full pointer-events-none"
        style={{ width: 400, height: 400, background: '#4C1D95', filter: 'blur(120px)', opacity: 0.06, bottom: -100, left: '5%' }}
      />

      {/* Logo */}
      <Link href="/" className="mb-10">
        <Logo config="horizontal" size={0.72} />
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl border p-10"
        style={{
          background: 'rgba(19,16,30,0.85)',
          borderColor: '#1C1730',
          backdropFilter: 'blur(20px)',
        }}
      >
        {sent ? (
          <div className="flex flex-col items-center gap-5 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.3)' }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 11l6 6L20 3" />
              </svg>
            </div>
            <div className="flex flex-col gap-2">
              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 20, color: '#E8E6F0' }}>
                Check your email
              </p>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.7 }}>
                We sent a sign in link to{' '}
                <span style={{ color: '#A78BFA' }}>{email}</span>.
                Click it to access your contributor dashboard.
              </p>
            </div>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12, color: '#6B5FA0', lineHeight: 1.6 }}>
              The link expires in 60 minutes and can only be used once.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="btn-outline"
              style={{ fontSize: 13 }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1 mb-8">
              <h1
                style={{
                  fontFamily: 'Cabinet Grotesk, sans-serif',
                  fontWeight: 600,
                  fontSize: 26,
                  letterSpacing: '-0.02em',
                  color: '#E8E6F0',
                  lineHeight: 1.15,
                }}
              >
                Sign in to Zivana
              </h1>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.65 }}>
                Enter your email and we will send you a sign in link. No password needed.
              </p>
            </div>

            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '13px 16px',
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
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#FCA5A5' }}>
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

            <div
              className="mt-6 pt-6 flex flex-col gap-3"
              style={{ borderTop: '1px solid #1C1730' }}
            >
              <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12, color: '#6B5FA0', textAlign: 'center', lineHeight: 1.6 }}>
                New to Zivana? Register as a contributor first.
              </p>
              <button
                type="button"
                onClick={() => { setShowSignup(true); setSignupSent(false); setSignupEmail(''); setSignupError('') }}
                className="btn-outline justify-center"
                style={{ fontSize: 13, width: '100%', cursor: 'pointer' }}
              >
                Register as contributor
              </button>
              <Link
                href="/contribute"
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontSize: 12,
                  color: '#6B5FA0',
                  textAlign: 'center',
                  textDecoration: 'none',
                  marginTop: 4,
                }}
              >
                Back to contribute overview
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Signup modal */}
      {showSignup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,11,20,0.92)', backdropFilter: 'blur(16px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSignup(false) }}
        >
          <div
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            style={{ background: '#13101E', borderColor: '#1C1730' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#1C1730' }}>
              <div>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: '#E8E6F0' }}>
                  Create your account
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8', marginTop: 4 }}>
                  Enter your email to receive a verification link
                </p>
              </div>
              <button
                onClick={() => setShowSignup(false)}
                style={{ color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {signupSent ? (
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(109,40,217,0.12)', border: '1px solid rgba(109,40,217,0.25)' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M3 7l11 9 11-9M3 7h22v16H3z" />
                    </svg>
                  </div>
                  <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: '#E8E6F0' }}>
                    Check your email
                  </p>
                  <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.7 }}>
                    We sent a verification link to <span style={{ color: '#A78BFA' }}>{signupEmail}</span>. Click it to verify your email and start your registration.
                  </p>
                  <button
                    onClick={() => { setSignupSent(false); setSignupEmail('') }}
                    style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#6B5FA0', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="flex flex-col gap-4">
                  <div>
                    <label style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', letterSpacing: '0.1em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 8 }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '13px 16px',
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
                  </div>

                  {signupError && (
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#FCA5A5' }}>
                      {signupError}
                    </p>
                  )}

                  <div
                    className="p-4 rounded-xl"
                    style={{ background: 'rgba(109,40,217,0.06)', border: '1px solid rgba(109,40,217,0.15)' }}
                  >
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#A78BFA', lineHeight: 1.65 }}>
                      After clicking the link in your email you will be directed to complete your contributor application. The core team reviews all applications before activation.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={signupSending || !signupEmail.trim()}
                    className="btn-primary justify-center"
                    style={{ opacity: signupSending || !signupEmail.trim() ? 0.5 : 1 }}
                  >
                    {signupSending ? 'Sending link...' : 'Send verification link'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}