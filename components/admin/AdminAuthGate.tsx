'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/contribute/signin')
        return
      }

      const { data } = await supabase
        .from('core_team')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (!data) {
        router.replace('/contribute/dashboard')
        return
      }

      setAuthorized(true)
    }
    check()
  }, [router])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid #1C1730',
          borderTop: '2px solid #6D28D9',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  return <>{children}</>
}