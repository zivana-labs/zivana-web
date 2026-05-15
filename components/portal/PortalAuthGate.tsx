'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Status = 'loading' | 'active' | 'pending' | 'revision_requested' | 'rejected' | 'inactive' | 'unregistered' | 'unauthenticated'

export default function PortalAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [contributorName, setContributorName] = useState('')
  const [revisionNotes, setRevisionNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/contribute/signin')
        return
      }

      const { data: contributor } = await supabase
        .from('contributors')
        .select('id, name, status, revision_notes, rejection_reason')
        .eq('user_id', user.id)
        .single()

      if (!contributor) {
        setStatus('unregistered')
        return
      }

      setContributorName(contributor.name)
      setRevisionNotes(contributor.revision_notes ?? '')
      setRejectionReason(contributor.rejection_reason ?? '')
      setStatus(contributor.status as Status)
    }
    check()
  }, [router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1C1730', borderTop: '2px solid #6D28D9', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (status === 'unregistered') {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: 'rgba(109,40,217,0.12)', border: '1px solid rgba(109,40,217,0.25)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
              <path d="M16 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM4 28c0-6.627 5.373-12 12-12s12 5.373 12 12" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', color: '#E8E6F0', marginBottom: 12 }}>
            Complete your application
          </h2>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', lineHeight: 1.75, marginBottom: 32 }}>
            Your email has been verified. Complete your contributor application to get started. The core team will review your profile before activating your account.
          </p>
          <Link href="/contribute/register" className="btn-primary" style={{ fontSize: 14 }}>
            Complete your application
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="16" cy="16" r="12" />
              <path d="M16 10v6l4 4" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', color: '#E8E6F0', marginBottom: 12 }}>
            Application under review
          </h2>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', lineHeight: 1.75, marginBottom: 12 }}>
            Hi {contributorName}, your application has been received and is being reviewed by the core team. You will receive an email once your account is activated.
          </p>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#6B5FA0', lineHeight: 1.75, marginBottom: 32 }}>
            In the meantime you can browse open tasks and the public leaderboard.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contribute/tasks" className="btn-primary" style={{ fontSize: 13 }}>
              Browse tasks
            </Link>
            <Link href="/contribute/leaderboard" className="btn-outline" style={{ fontSize: 13 }}>
              View leaderboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'revision_requested') {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 20l6-6 5 5 8-10" />
              <path d="M28 8h-6M28 8v6" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', color: '#E8E6F0', marginBottom: 12 }}>
            Updates needed
          </h2>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', lineHeight: 1.75, marginBottom: 24 }}>
            Hi {contributorName}, the core team has reviewed your application and needs some updates before they can proceed.
          </p>
          {revisionNotes && (
            <div className="p-5 rounded-2xl border mb-28 text-left" style={{ background: '#13101E', borderColor: 'rgba(14,165,233,0.2)' }}>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7DD3FC', marginBottom: 8 }}>
                Feedback from the core team
              </p>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#E8E6F0', lineHeight: 1.7 }}>
                {revisionNotes}
              </p>
            </div>
          )}
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#6B5FA0', lineHeight: 1.75, marginBottom: 28 }}>
            Update your profile below and your application will be automatically resubmitted for review.
          </p>
          <Link href="/contribute/register" className="btn-primary" style={{ fontSize: 13 }}>
            Update your application
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: 'rgba(109,40,217,0.08)', border: '1px solid rgba(109,40,217,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#6B5FA0" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="16" cy="16" r="12" />
              <path d="M12 12l8 8M20 12l-8 8" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', color: '#E8E6F0', marginBottom: 12 }}>
            Application not approved
          </h2>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', lineHeight: 1.75, marginBottom: 24 }}>
            Hi {contributorName}, thank you for your interest in contributing to Zivana Protocol. Unfortunately we are unable to approve your application at this time.
          </p>
          {rejectionReason && (
            <div className="p-5 rounded-2xl border mb-8 text-left" style={{ background: '#13101E', borderColor: 'rgba(109,40,217,0.15)' }}>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B5FA0', marginBottom: 8 }}>
                Reason
              </p>
              <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 14, color: '#E8E6F0', lineHeight: 1.7 }}>
                {rejectionReason}
              </p>
            </div>
          )}
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#6B5FA0', lineHeight: 1.75, marginBottom: 28 }}>
            You are welcome to continue browsing the public task board and leaderboard.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contribute/tasks" className="btn-primary" style={{ fontSize: 13 }}>
              Browse tasks
            </Link>
            <Link href="/contribute/leaderboard" className="btn-outline" style={{ fontSize: 13 }}>
              View leaderboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'inactive') {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-8">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8" style={{ background: 'rgba(139,126,200,0.08)', border: '1px solid rgba(139,126,200,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#8B7EC8" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="11" width="26" height="18" rx="2" />
              <path d="M9 11V8a7 7 0 0 1 14 0v3" />
            </svg>
          </div>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em', color: '#E8E6F0', marginBottom: 12 }}>
            Account deactivated
          </h2>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 15, color: '#7B6FA8', lineHeight: 1.75, marginBottom: 32 }}>
            Your contributor account has been deactivated. Contact the core team if you believe this is an error.
          </p>
          <Link href="/contribute" className="btn-outline" style={{ fontSize: 13 }}>
            Back to contribute
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}