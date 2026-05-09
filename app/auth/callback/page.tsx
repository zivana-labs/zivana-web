'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function CallbackPage() {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    const errorDescription = params.get('error_description')

    if (error) {
      setErrorMsg(errorDescription?.replace(/\+/g, ' ') ?? error)
      setChecking(false)
      return
    }

    const handleCallback = async () => {
      // Small delay to ensure the fragment is processed by Supabase client
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (session) {
        router.replace('/contribute/dashboard')
        return
      }

      setErrorMsg('Sign in link is invalid or has expired.')
      setChecking(false)
    }

    handleCallback()
  }, [router])

  if (checking) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#0D0B14' }}
      >
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid #1C1730',
          borderTop: '2px solid #6D28D9',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
          Signing you in...
        </p>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8"
      style={{ background: '#0D0B14' }}
    >
      <div
        className="flex flex-col items-center gap-6 max-w-md w-full text-center p-10 rounded-2xl border"
        style={{ background: '#13101E', borderColor: '#1C1730' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(109,40,217,0.1)', border: '1px solid rgba(109,40,217,0.25)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" strokeWidth="2" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h1 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 22, color: '#E8E6F0', letterSpacing: '-0.02em' }}>
            Sign in link expired
          </h1>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 14, color: '#7B6FA8', lineHeight: 1.7 }}>
            {errorMsg}
          </p>
        </div>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#8B7EC8', lineHeight: 1.65 }}>
          Magic links expire after 60 minutes and can only be used once. Request a new one to sign in.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Link href="/contribute" className="btn-primary justify-center" style={{ fontSize: 13 }}>
            Request a new sign in link
          </Link>
          <Link href="/" className="btn-outline justify-center" style={{ fontSize: 13 }}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}