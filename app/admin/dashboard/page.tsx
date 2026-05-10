'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Stats = {
  pendingContributors: number
  activeContributors: number
  pendingContributions: number
  verifiedContributions: number
  openTasks: number
  assignedTasks: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [
        { count: pendingContributors },
        { count: activeContributors },
        { count: pendingContributions },
        { count: verifiedContributions },
        { count: openTasks },
        { count: assignedTasks },
      ] = await Promise.all([
        supabase.from('contributors').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('contributors').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('contributions').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('contributions').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'assigned'),
      ])

      setStats({
        pendingContributors: pendingContributors ?? 0,
        activeContributors: activeContributors ?? 0,
        pendingContributions: pendingContributions ?? 0,
        verifiedContributions: verifiedContributions ?? 0,
        openTasks: openTasks ?? 0,
        assignedTasks: assignedTasks ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    {
      label: 'Pending contributors',
      value: stats?.pendingContributors,
      color: '#FCD34D',
      urgent: (stats?.pendingContributors ?? 0) > 0,
      href: '/admin/dashboard/contributors?filter=pending',
    },
    {
      label: 'Active contributors',
      value: stats?.activeContributors,
      color: '#5EEAD4',
      urgent: false,
      href: '/admin/dashboard/contributors',
    },
    {
      label: 'Pending contributions',
      value: stats?.pendingContributions,
      color: '#FCD34D',
      urgent: (stats?.pendingContributions ?? 0) > 0,
      href: '/admin/dashboard/contributions?filter=submitted',
    },
    {
      label: 'Verified contributions',
      value: stats?.verifiedContributions,
      color: '#5EEAD4',
      urgent: false,
      href: '/admin/dashboard/contributions?filter=verified',
    },
    {
      label: 'Open tasks',
      value: stats?.openTasks,
      color: '#A78BFA',
      urgent: false,
      href: '/admin/dashboard/tasks?filter=open',
    },
    {
      label: 'Assigned tasks',
      value: stats?.assignedTasks,
      color: '#7DD3FC',
      urgent: false,
      href: '/admin/dashboard/tasks?filter=assigned',
    },
  ]

  return (
    <div className="min-h-screen bg-void pt-8 pb-20 px-8 lg:px-12">
      <div className="mb-10">
        <span style={{
          fontFamily: 'Switzer, sans-serif',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#8B7EC8',
        }}>
          Admin Panel
        </span>
        <h1
          className="mt-2 mb-3"
          style={{
            fontFamily: 'Cabinet Grotesk, sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(24px,4vw,40px)',
            letterSpacing: '-0.025em',
            color: '#E8E6F0',
            lineHeight: 1.1,
          }}
        >
          Overview
        </h1>
        <p style={{
          fontFamily: 'Switzer, sans-serif',
          fontWeight: 300,
          fontSize: 14,
          color: '#7B6FA8',
          lineHeight: 1.75,
        }}>
          Core team dashboard. Manage contributors, verify contributions, and maintain the task board.
        </p>
      </div>

      {/* Urgent actions banner */}
      {!loading && (stats?.pendingContributors ?? 0) + (stats?.pendingContributions ?? 0) > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border mb-8"
          style={{
            background: 'rgba(234,179,8,0.08)',
            borderColor: 'rgba(234,179,8,0.25)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="7" />
            <path d="M8 5v3M8 11h.01" strokeWidth="2" />
          </svg>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#FCD34D' }}>
            You have{' '}
            {(stats?.pendingContributors ?? 0) > 0 && `${stats?.pendingContributors} pending contributor${stats?.pendingContributors !== 1 ? 's' : ''}`}
            {(stats?.pendingContributors ?? 0) > 0 && (stats?.pendingContributions ?? 0) > 0 && ' and '}
            {(stats?.pendingContributions ?? 0) > 0 && `${stats?.pendingContributions} contribution${stats?.pendingContributions !== 1 ? 's' : ''} awaiting review`}
            {' '}requiring your attention.
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="flex flex-col gap-3 p-6 rounded-2xl border"
            style={{
              background: card.urgent ? 'rgba(234,179,8,0.05)' : '#13101E',
              borderColor: card.urgent ? 'rgba(234,179,8,0.25)' : '#1C1730',
              textDecoration: 'none',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = card.color + '50'
              el.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = card.urgent ? 'rgba(234,179,8,0.25)' : '#1C1730'
              el.style.transform = 'translateY(0)'
            }}
          >
            <span style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 36,
              letterSpacing: '-0.02em',
              color: card.color,
              lineHeight: 1,
            }}>
              {loading ? '—' : card.value}
            </span>
            <span style={{
              fontFamily: 'Switzer, sans-serif',
              fontSize: 12,
              color: '#8B7EC8',
              lineHeight: 1.4,
            }}>
              {card.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Review contributors',
            desc: 'Approve or reject pending contributor applications',
            href: '/admin/dashboard/contributors?filter=pending',
            color: '#FCD34D',
          },
          {
            title: 'Verify contributions',
            desc: 'Review submitted work and assign final points',
            href: '/admin/dashboard/contributions?filter=submitted',
            color: '#A78BFA',
          },
          {
            title: 'Manage tasks',
            desc: 'Create, edit, and manage the open task board',
            href: '/admin/dashboard/tasks',
            color: '#7DD3FC',
          },
        ].map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex flex-col gap-3 p-6 rounded-2xl border"
            style={{
              background: '#13101E',
              borderColor: '#1C1730',
              textDecoration: 'none',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = item.color + '40'
              el.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = '#1C1730'
              el.style.transform = 'translateY(0)'
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: item.color + '15',
                border: `1px solid ${item.color}30`,
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
            </div>
            <p style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 14,
              color: '#E8E6F0',
            }}>
              {item.title}
            </p>
            <p style={{
              fontFamily: 'Switzer, sans-serif',
              fontWeight: 300,
              fontSize: 12,
              color: '#7B6FA8',
              lineHeight: 1.6,
            }}>
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}