'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthRedirect() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const handleRedirect = async () => {
      await new Promise(resolve => setTimeout(resolve, 500))

      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/contribute')
        return
      }

      router.push('/contribute/dashboard')
    }

    if (!checked) {
      handleRedirect()
      setChecked(true)
    }
  }, [router, checked])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ background: '#0D0B14' }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid #1C1730',
          borderTop: '2px solid #6D28D9',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
        Redirecting...
      </p>
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}