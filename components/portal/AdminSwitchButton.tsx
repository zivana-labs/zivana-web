'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminSwitchButton() {
  const router = useRouter()
  const [isCoreTeam, setIsCoreTeam] = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('core_team')
        .select('id, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      console.log('Core team check:', { data, error, userId: user.id })

      if (data) setIsCoreTeam(true)
    }
    check()
  }, [])

  if (!isCoreTeam) return null

  return (
    <button
      onClick={() => router.push('/admin/dashboard')}
      className="fixed top-4 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl"
      style={{
        background: 'rgba(109,40,217,0.12)',
        border: '1px solid rgba(109,40,217,0.3)',
        color: '#A78BFA',
        fontFamily: 'Switzer, sans-serif',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(109,40,217,0.2)'
        el.style.borderColor = 'rgba(109,40,217,0.3)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'rgba(109,40,217,0.12)'
        el.style.borderColor = 'rgba(109,40,217,0.3)'
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1" y="1" width="5" height="5" rx="1" />
        <rect x="8" y="1" width="5" height="5" rx="1" />
        <rect x="1" y="8" width="5" height="5" rx="1" />
        <rect x="8" y="8" width="5" height="5" rx="1" />
      </svg>
      Admin panel
    </button>
  )
}