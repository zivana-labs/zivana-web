'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Contributor = {
  id: string
  name: string
  email: string
  categories: string[]
  bio: string
  location: string
  github_handle: string
  twitter_handle: string
  linkedin_url: string
  portfolio_url: string
  skills: string[]
  timezone: string
  contributor_type: string
  team_name: string
  availability_hours_per_week: number
  wallet_address: string
  total_points: number
  verified_contributions: number
  status: string
  notification_email: boolean
  notification_telegram: boolean
  telegram_chat_id: string | null
  max_claims: number
}

type Contribution = {
  id: string
  title: string
  category: string
  complexity: string
  base_points: number
  final_points: number
  status: string
  created_at: string
}

type ClaimedTask = {
  id: string
  title: string
  description: string
  category: string
  complexity: string
  point_range_min: number
  point_range_max: number
  claimed_at: string
  deadline_at: string
  deadline_days: number
  extension_granted: boolean
  extension_requested_at: string | null
  extended_deadline_at: string | null
}

const CATEGORY_COLOURS: Record<string, string> = {
  technical:  '#7DD3FC',
  design:     '#C084FC',
  community:  '#5EEAD4',
  research:   '#FCD34D',
  operations: '#A78BFA',
}

const STATUS_COLOURS: Record<string, { bg: string; text: string; border: string }> = {
  submitted:    { bg: 'rgba(92,64,20,0.15)',   text: '#FCD34D', border: 'rgba(92,64,20,0.3)' },
  under_review: { bg: 'rgba(28,95,138,0.15)',  text: '#7DD3FC', border: 'rgba(28,95,138,0.3)' },
  verified:     { bg: 'rgba(15,118,110,0.15)', text: '#5EEAD4', border: 'rgba(15,118,110,0.3)' },
  rejected:     { bg: 'rgba(127,29,29,0.15)',  text: '#FCA5A5', border: 'rgba(127,29,29,0.3)' },
}

function ProfileEditForm({
  contributor,
  onSave,
}: {
  contributor: Contributor
  onSave: (updated: Contributor) => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    bio: contributor.bio ?? '',
    location: contributor.location ?? '',
    timezone: contributor.timezone ?? '',
    availability_hours_per_week: contributor.availability_hours_per_week ?? 5,
    github_handle: contributor.github_handle ?? '',
    twitter_handle: contributor.twitter_handle ?? '',
    linkedin_url: contributor.linkedin_url ?? '',
    portfolio_url: contributor.portfolio_url ?? '',
    wallet_address: contributor.wallet_address ?? '',
    skills: contributor.skills?.join(', ') ?? '',
    notification_email: contributor.notification_email ?? true,
    notification_telegram: contributor.notification_telegram ?? false,
  })
  const [claimedTasks, setClaimedTasks] = useState<ClaimedTask[]>([])

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
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
    color: '#6B5FA0',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: 5,
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    const skillsArray = form.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const { data, error } = await supabase
      .from('contributors')
      .update({
        bio: form.bio || null,
        location: form.location || null,
        timezone: form.timezone || null,
        availability_hours_per_week: form.availability_hours_per_week || null,
        github_handle: form.github_handle || null,
        twitter_handle: form.twitter_handle || null,
        linkedin_url: form.linkedin_url || null,
        portfolio_url: form.portfolio_url || null,
        wallet_address: form.wallet_address || null,
        skills: skillsArray.length > 0 ? skillsArray : null,
        notification_email: form.notification_email,
        notification_telegram: form.notification_telegram,
      })
      .eq('id', contributor.id)
      .select()
      .single()

    if (!error && data) {
      onSave(data)
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    }

    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-4 mt-2">
      {/* Read-only fields */}
      <div className="p-5 rounded-xl border" style={{ background: '#0F0D1A', borderColor: '#1E1640' }}>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 500, fontSize: 11, color: '#6B5FA0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          Read-only fields
        </p>
        <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12, color: '#7B6FA8', lineHeight: 1.65 }}>
          Name, email, and categories cannot be changed here. To update these contact the core team at{' '}
          <span style={{ color: '#A78BFA' }}>community@zivana.network</span>.
        </p>
      </div>

      {saved && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ background: 'rgba(15,118,110,0.1)', borderColor: 'rgba(15,118,110,0.25)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 8l4 4L14 3" />
          </svg>
          <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#5EEAD4' }}>
            Profile updated successfully.
          </p>
        </div>
      )}

      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="btn-outline"
          style={{ fontSize: 13, alignSelf: 'flex-start' }}
        >
          Edit profile
        </button>
      ) : (
        <div className="flex flex-col gap-5 p-6 rounded-2xl border" style={{ background: '#13101E', borderColor: '#1C1730' }}>
          <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>
            Edit profile
          </p>

          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
              onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
              />
            </div>
            <div>
              <label style={labelStyle}>Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                style={inputStyle}
              >
                {[
                  'Africa/Lagos', 'Africa/Nairobi', 'Africa/Accra',
                  'Africa/Johannesburg', 'Africa/Cairo', 'Europe/London',
                  'Europe/Berlin', 'America/New_York', 'America/Los_Angeles',
                  'Asia/Dubai', 'Asia/Singapore',
                ].map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Skills{' '}
              <span style={{ textTransform: 'none', letterSpacing: 0, color: '#8B7EC8' }}>(comma separated)</span>
            </label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="Aiken, TypeScript, Cardano, React..."
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
              onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
            />
          </div>

          <div>
            <label style={labelStyle}>Availability</label>
            <select
              value={form.availability_hours_per_week}
              onChange={(e) => setForm({ ...form, availability_hours_per_week: Number(e.target.value) })}
              style={inputStyle}
            >
              {[
                { value: 2,  label: '1-2 hours per week' },
                { value: 5,  label: '3-5 hours per week' },
                { value: 10, label: '6-10 hours per week' },
                { value: 20, label: '10-20 hours per week' },
                { value: 40, label: 'Full time (20+ hours)' },
              ].map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>GitHub handle</label>
              <input
                type="text"
                value={form.github_handle}
                onChange={(e) => setForm({ ...form, github_handle: e.target.value })}
                placeholder="yourhandle"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
              />
            </div>
            <div>
              <label style={labelStyle}>Twitter / X handle</label>
              <input
                type="text"
                value={form.twitter_handle}
                onChange={(e) => setForm({ ...form, twitter_handle: e.target.value })}
                placeholder="yourhandle"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>LinkedIn URL</label>
              <input
                type="url"
                value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
              />
            </div>
            <div>
              <label style={labelStyle}>Portfolio URL</label>
              <input
                type="url"
                value={form.portfolio_url}
                onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })}
                placeholder="https://yourportfolio.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Wallet address{' '}
              <span style={{ textTransform: 'none', letterSpacing: 0, color: '#8B7EC8' }}>(Cardano)</span>
            </label>
            <input
              type="text"
              value={form.wallet_address}
              onChange={(e) => setForm({ ...form, wallet_address: e.target.value })}
              placeholder="addr1..."
              style={{ ...inputStyle, fontFamily: 'Courier New, monospace', fontSize: 12 }}
              onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
              onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
            />
          </div>

          <div>
            <label style={labelStyle}>Reminder notifications</label>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8', marginBottom: 10, lineHeight: 1.6 }}>
              Choose how you receive deadline reminders for claimed tasks.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { key: 'notification_email', label: 'Email reminders', desc: 'Reminders sent to your registered email address' },
                { key: 'notification_telegram', label: 'Telegram reminders', desc: 'Reminders sent via the Zivana Telegram bot' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setForm({ ...form, [item.key]: !form[item.key as keyof typeof form] })}
                  className="flex items-center gap-3 p-4 rounded-xl border text-left"
                  style={{
                    background: form[item.key as keyof typeof form] ? 'rgba(109,40,217,0.1)' : '#0D0B14',
                    borderColor: form[item.key as keyof typeof form] ? '#6D28D9' : '#1C1730',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `2px solid ${form[item.key as keyof typeof form] ? '#6D28D9' : '#2D2450'}`,
                      background: form[item.key as keyof typeof form] ? '#6D28D9' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}
                  >
                    {form[item.key as keyof typeof form] && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M1.5 5l2.5 2.5 4.5-5" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: form[item.key as keyof typeof form] ? '#A78BFA' : '#E8E6F0', marginBottom: 2 }}>
                      {item.label}
                    </p>
                    <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 11.5, color: '#7B6FA8', lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            {form.notification_telegram && !contributor.telegram_chat_id && (
              <div
                className="mt-3 p-4 rounded-xl border"
                style={{ background: 'rgba(109,40,217,0.06)', borderColor: 'rgba(109,40,217,0.2)' }}
              >
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#A78BFA', lineHeight: 1.65 }}>
                  To receive Telegram reminders, message the Zivana bot after saving. Your Telegram account will be linked automatically when you start a conversation.
                </p>
                <a
                  href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=${contributor.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex mt-3"
                  style={{ fontSize: 12, padding: '8px 16px' }}
                >
                  Connect Telegram
                </a>
              </div>
            )}
            {contributor.telegram_chat_id && (
              <div
                className="mt-3 flex items-center gap-2 p-3 rounded-xl border"
                style={{ background: 'rgba(15,118,110,0.08)', borderColor: 'rgba(15,118,110,0.2)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 7l3 3 7-7" />
                </svg>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#5EEAD4' }}>
                  Telegram connected
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
              style={{ fontSize: 13, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-outline"
              style={{ fontSize: 13 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [contributor, setContributor] = useState<Contributor | null>(null)
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [claimedTasks, setClaimedTasks] = useState<ClaimedTask[]>([])
  const [activeClaimCount, setActiveClaimCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'overview' | 'contributions' | 'profile'>('overview')

  // New contribution form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'technical',
    complexity: 'medium',
    evidence_url: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/contribute')
        return
      }
      setUser(user)

      // Wait for session cookie to fully settle before querying
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data: contributorData } = await supabase
        .from('contributors')
        .select('*')
        .eq('email', user.email)
        .single()



      if (contributorData) {
        setContributor(contributorData)

        // Fetch their contributions
        const { data: contribData } = await supabase
          .from('contributions')
          .select('*')
          .eq('contributor_id', contributorData.id)
          .order('created_at', { ascending: false })

        if (contribData) setContributions(contribData)

        const { data: claimedData } = await supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', contributorData.id)
          .eq('status', 'assigned')
          .order('claimed_at', { ascending: true })

        if (claimedData) setClaimedTasks(claimedData)
      }

      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    const t = searchParams.get('tab') as 'overview' | 'contributions' | 'profile'
    if (t && ['overview', 'contributions', 'profile'].includes(t)) {
      setTab(t)
    } else {
      setTab('overview')
    }
  }, [searchParams])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/contribute')
  }

  async function handleSubmitContribution(e: React.FormEvent) {
    e.preventDefault()
    if (!contributor) return
    setSubmitting(true)

    const BASE_POINTS: Record<string, Record<string, number>> = {
      technical:  { small: 85,  medium: 215, large: 400 },
      design:     { small: 55,  medium: 120, large: 240 },
      research:   { small: 75,  medium: 150, large: 300 },
      operations: { small: 45,  medium: 115, large: 175 },
      community:  { small: 20,  medium: 90,  large: 125 },
    }

    const base_points = BASE_POINTS[form.category]?.[form.complexity] ?? 100

    // Calculate timing multiplier
    // Community category is always 1.0x regardless of timing
    const EXEMPT_CATEGORIES = ['community']
    let timing_multiplier = 1.0
    let deadline_at: string | null = null

    if (!EXEMPT_CATEGORIES.includes(form.category)) {
      const supabase = createClient()

      // Find the claimed task matching this submission to get its deadline
      const { data: claimedTask } = await supabase
        .from('tasks')
        .select('deadline_at, extended_deadline_at, extension_granted, claimed_at, deadline_days')
        .eq('assigned_to', contributor.id)
        .eq('status', 'assigned')
        .eq('category', form.category)
        .order('claimed_at', { ascending: false })
        .limit(1)
        .single()

      if (claimedTask?.deadline_at) {
        const now = new Date()
        const effectiveDeadline = claimedTask.extension_granted && claimedTask.extended_deadline_at
          ? new Date(claimedTask.extended_deadline_at)
          : new Date(claimedTask.deadline_at)

        const claimedAt = new Date(claimedTask.claimed_at)
        const totalMs = (claimedTask.deadline_days ?? 3) * 24 * 60 * 60 * 1000
        const elapsed = now.getTime() - claimedAt.getTime()
        const percentUsed = elapsed / totalMs
        const isOverdue = now > effectiveDeadline

        deadline_at = effectiveDeadline.toISOString()

        if (!isOverdue && percentUsed <= 0.5) {
          // Within first 50% of deadline — early bonus
          timing_multiplier = 1.2
        } else if (!isOverdue && percentUsed <= 1.0) {
          // Between 50% and 100% of deadline — base points
          timing_multiplier = 1.0
        } else {
          // Past deadline but within extension window — late penalty
          timing_multiplier = 0.8
        }
      }
    }

    const final_points = Math.round(base_points * timing_multiplier)

    const supabase = createClient()
    const { error } = await supabase
      .from('contributions')
      .insert({
        contributor_id: contributor.id,
        title: form.title,
        description: form.description,
        category: form.category,
        complexity: form.complexity,
        base_points,
        final_points,
        timing_multiplier,
        deadline_at,
        evidence_url: form.evidence_url || null,
        status: 'submitted',
      })

    if (!error) {
      setSubmitSuccess(true)
      setShowForm(false)
      setForm({ title: '', description: '', category: 'technical', complexity: 'medium', evidence_url: '' })

      // Remove the task from active claims since work has been submitted
      if (form.category !== 'community') {
        const { data: submittedTask } = await supabase
          .from('tasks')
          .select('id')
          .eq('assigned_to', contributor.id)
          .eq('status', 'assigned')
          .eq('category', form.category)
          .order('claimed_at', { ascending: false })
          .limit(1)
          .single()

        if (submittedTask) {
          await supabase
            .from('tasks')
            .update({ status: 'completed' })
            .eq('id', submittedTask.id)

          setClaimedTasks(prev => prev.filter(t => t.id !== submittedTask.id))
          setActiveClaimCount(prev => Math.max(0, prev - 1))
        }
      }

      // Refresh contributions
      const { data } = await supabase
        .from('contributions')
        .select('*')
        .eq('contributor_id', contributor.id)
        .order('created_at', { ascending: false })
      if (data) setContributions(data)
    }

    setSubmitting(false)
  }

  function getTimeRemaining(task: ClaimedTask) {
    const effectiveDeadline = task.extension_granted && task.extended_deadline_at
      ? new Date(task.extended_deadline_at)
      : new Date(task.deadline_at)
    const now = new Date()
    const diff = effectiveDeadline.getTime() - now.getTime()
    const totalMs = task.deadline_days * 24 * 60 * 60 * 1000
    const elapsed = now.getTime() - new Date(task.claimed_at).getTime()
    const percentUsed = totalMs > 0 && !isNaN(elapsed) ? Math.max(0, elapsed / totalMs) : 0
    const extensionWindowMs = (task.deadline_days === 3 ? 1 : task.deadline_days === 6 ? 2 : 3) * 24 * 60 * 60 * 1000

    return {
      days: Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24)),
      hours: Math.floor((Math.abs(diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      isOverdue: diff < 0,
      withinExtensionWindow: diff < 0 && Math.abs(diff) < extensionWindowMs,
      percentUsed: Math.min(percentUsed, 1),
      urgency: diff < 0 ? 'overdue' : percentUsed > 0.5 ? 'urgent' : 'normal',
    }
  }

  function getExtensionDays(complexity: string) {
    return complexity === 'small' ? 1 : complexity === 'medium' ? 2 : 3
  }

  function canRequestExtension(task: ClaimedTask) {
    if (task.extension_granted) return false
    if (task.extension_requested_at) return false
    return new Date() < new Date(task.deadline_at)
  }

  async function handleUnclaim(taskId: string) {
    if (!contributor) return
    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'open',
        assigned_to: null,
        claimed_at: null,
        deadline_at: null,
        unclaimed_by: [contributor.id],
        unclaimed_at: [new Date().toISOString()],
      })
      .eq('id', taskId)

    if (!error) {
      setClaimedTasks(prev => prev.filter(t => t.id !== taskId))
    }
  }

  async function handleRequestExtension(taskId: string) {
    const task = claimedTasks.find(t => t.id === taskId)
    if (!task) return
    const extensionDays = getExtensionDays(task.complexity)
    const extendedDeadline = new Date(new Date(task.deadline_at).getTime() + extensionDays * 24 * 60 * 60 * 1000)
    const supabase = createClient()

    const { error } = await supabase
      .from('tasks')
      .update({
        extension_requested_at: new Date().toISOString(),
        extension_granted: true,
        extended_deadline_at: extendedDeadline.toISOString(),
      })
      .eq('id', taskId)

    if (!error) {
      setClaimedTasks(prev => prev.map(t =>
        t.id === taskId
          ? { ...t, extension_requested_at: new Date().toISOString(), extension_granted: true, extended_deadline_at: extendedDeadline.toISOString() }
          : t
      ))
    }
  }

  if (loading) {
    return (
      <div className="bg-void min-h-screen pt-36 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              border: '2px solid #1C1730',
              borderTop: '2px solid #6D28D9',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
            Loading dashboard...
          </span>
        </div>
        <style jsx>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  if (!contributor) {
    return (
      <div className="bg-void min-h-screen pt-36 pb-28">
        <div className="max-w-2xl mx-auto px-8 lg:px-14 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'rgba(109,40,217,0.12)', border: '1px solid rgba(109,40,217,0.25)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="7" r="4" />
              <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
            </svg>
          </div>
          <h2
            className="mb-4"
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 28,
              color: '#E8E6F0',
              letterSpacing: '-0.02em',
            }}
          >
            Account pending review
          </h2>
          <p
            className="mb-8"
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontWeight: 300,
              fontSize: 15,
              color: '#7B6FA8',
              lineHeight: 1.75,
            }}
          >
            You are signed in as <span style={{ color: '#A78BFA' }}>{user?.email}</span> but your contributor profile has not been set up yet. Complete your registration or wait for core team activation.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/contribute/register" className="btn-primary">
              Complete registration
            </Link>
            <button onClick={handleSignOut} className="btn-outline">
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  const color = CATEGORY_COLOURS[contributor.categories?.[0]] ?? '#A78BFA'
  const pendingCount = contributions.filter(c => c.status === 'submitted' || c.status === 'under_review').length
  const verifiedCount = contributions.filter(c => c.status === 'verified').length

  return (
    <div className="bg-void min-h-screen pt-36 pb-28">
      <div className="max-w-5xl mx-auto px-8 lg:px-14">

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-12 flex-wrap">
          <div className="flex items-center gap-5">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 56,
                height: 56,
                background: color + '18',
                border: `1px solid ${color}35`,
              }}
            >
              <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 22, color }}>
                {contributor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'Cabinet Grotesk, sans-serif',
                  fontWeight: 600,
                  fontSize: 'clamp(20px,3vw,32px)',
                  letterSpacing: '-0.02em',
                  color: '#E8E6F0',
                  lineHeight: 1.1,
                }}
              >
                {contributor.contributor_type === 'team' && contributor.team_name
                  ? contributor.team_name
                  : contributor.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {contributor.categories?.map((cat) => {
                  const catColor = CATEGORY_COLOURS[cat] ?? '#A78BFA'
                  return (
                    <span
                      key={cat}
                      style={{
                        padding: '2px 10px',
                        borderRadius: 20,
                        background: catColor + '15',
                        color: catColor,
                        border: `1px solid ${catColor}30`,
                        fontFamily: 'Switzer, sans-serif',
                        fontSize: 10,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {cat}
                    </span>
                  )
                })}
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 20,
                    background: contributor.status === 'active'
                      ? 'rgba(15,118,110,0.12)'
                      : 'rgba(92,64,20,0.12)',
                    color: contributor.status === 'active' ? '#5EEAD4' : '#FCD34D',
                    border: `1px solid ${contributor.status === 'active'
                      ? 'rgba(15,118,110,0.25)'
                      : 'rgba(92,64,20,0.25)'}`,
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {contributor.status}
                </span>
              </div>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-outline" style={{ fontSize: 12 }}>
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total points',           value: contributor.total_points.toLocaleString(), color },
            { label: 'Verified contributions', value: contributor.verified_contributions,         color: '#5EEAD4' },
            { label: 'Pending review',         value: pendingCount,                              color: '#FCD34D' },
            { label: 'All submissions',        value: contributions.length,                       color: '#7B6FA8' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-2 p-5 rounded-2xl border"
              style={{ background: '#13101E', borderColor: '#1C1730' }}
            >
              <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 26, letterSpacing: '-0.02em', color: s.color, lineHeight: 1 }}>
                {s.value}
              </span>
              <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', lineHeight: 1.4 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Multiplier notice */}
        {contributor.verified_contributions >= 5 && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl border mb-8"
            style={{ background: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.25)' }}
          >
            <span style={{ fontSize: 18 }}>⚡</span>
            <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#A78BFA', lineHeight: 1.6 }}>
              Consistency multiplier active. Your points are being calculated at 1.2x for sustained contribution.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b mb-8" style={{ borderColor: '#1C1730' }}>
          {(['overview', 'contributions', 'profile'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '12px 20px',
                fontFamily: 'Switzer, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                color: tab === t ? '#A78BFA' : '#8B7EC8',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: `2px solid ${tab === t ? '#6D28D9' : 'transparent'}`,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'color 0.2s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-6">
            {submitSuccess && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{ background: 'rgba(15,118,110,0.1)', borderColor: 'rgba(15,118,110,0.25)' }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5EEAD4" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 8l4 4L14 3" />
                </svg>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#5EEAD4' }}>
                  Contribution submitted successfully. The core team will review it shortly.
                </p>
              </div>
            )}

            {/* Active claims */}
            {claimedTasks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>
                    Active claims
                  </p>
                  <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8' }}>
                    {claimedTasks.length} of {contributor?.max_claims ?? 2} slots used
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {claimedTasks.map((task) => {
                    const time = getTimeRemaining(task)
                    const catColor = CATEGORY_COLOURS[task.category] ?? '#A78BFA'
                    const urgencyColor = time.urgency === 'overdue' ? '#E8E6F0' : time.urgency === 'urgent' ? '#C4B5FD' : '#A78BFA'
                    const urgencyBg = time.urgency === 'overdue' ? 'rgba(109,40,217,0.15)' : time.urgency === 'urgent' ? 'rgba(139,92,246,0.1)' : 'rgba(109,40,217,0.08)'
                    const urgencyBorder = time.urgency === 'overdue' ? 'rgba(167,139,250,0.35)' : time.urgency === 'urgent' ? 'rgba(139,92,246,0.25)' : 'rgba(109,40,217,0.2)'
                    const effectiveDeadline = task.extension_granted && task.extended_deadline_at
                      ? new Date(task.extended_deadline_at)
                      : new Date(task.deadline_at)

                    return (
                      <div key={task.id} className="rounded-2xl border overflow-hidden" style={{ background: '#13101E', borderColor: '#1C1730' }}>

                        {/* Progress bar */}
                        <div style={{ height: 3, background: '#1C1730' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, Math.max(2, time.percentUsed * 100))}%`, background: 'linear-gradient(90deg, #6D28D9, #A78BFA)', transition: 'width 1s ease' }} />
                        </div>

                        <div className="p-5">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span style={{ padding: '2px 8px', borderRadius: 20, background: catColor + '15', color: catColor, border: `1px solid ${catColor}30`, fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                  {task.category}
                                </span>
                                <span style={{ padding: '2px 8px', borderRadius: 20, background: '#1E1640', color: '#6B5FA0', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                  {task.complexity}
                                </span>
                                {task.extension_granted && (
                                  <span style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(234,179,8,0.12)', color: '#FCD34D', border: '1px solid rgba(234,179,8,0.25)', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    Extended
                                  </span>
                                )}
                              </div>
                              <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0', lineHeight: 1.3 }}>
                                {task.title}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: catColor, lineHeight: 1 }}>
                                {task.point_range_min}–{task.point_range_max}
                              </div>
                              <div style={{ fontFamily: 'Switzer, sans-serif', fontSize: 9, color: '#8B7EC8', marginTop: 2 }}>pts</div>
                            </div>
                          </div>

                          {/* Countdown */}
                          <div className="flex items-center justify-between p-3 rounded-xl mb-4" style={{ background: urgencyBg, border: `1px solid ${urgencyBorder}` }}>
                            <div className="flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={urgencyColor} strokeWidth="1.5" strokeLinecap="round">
                                <circle cx="7" cy="7" r="6" />
                                <path d="M7 4v3l2 2" />
                              </svg>
                              <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: urgencyColor, fontWeight: 500 }}>
                                {time.isOverdue
                                  ? time.days === 0
                                    ? `Overdue by ${time.hours} hour${time.hours !== 1 ? 's' : ''}`
                                    : `Overdue by ${time.days} day${time.days !== 1 ? 's' : ''}`
                                  : time.days > 0
                                  ? `${time.days} day${time.days !== 1 ? 's' : ''} ${time.hours}h remaining`
                                  : `${time.hours} hour${time.hours !== 1 ? 's' : ''} remaining`
                                }
                              </span>
                            </div>
                            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: '#8B7EC8' }}>
                              Due {effectiveDeadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              onClick={() => {
                                setForm({ title: task.title, description: '', category: task.category, complexity: task.complexity, evidence_url: '' })
                                setShowForm(true)
                              }}
                              className="btn-primary"
                              style={{ fontSize: 11, padding: '7px 14px' }}
                            >
                              Submit work
                            </button>

                            {canRequestExtension(task) && (
                              <button
                                onClick={() => handleRequestExtension(task.id)}
                                style={{ fontSize: 11, padding: '7px 14px', borderRadius: 9999, border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.08)', color: '#FCD34D', fontFamily: 'Switzer, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}
                              >
                                Request +{getExtensionDays(task.complexity)}d extension
                              </button>
                            )}

                            {task.extension_requested_at && !task.extension_granted && (
                              <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', padding: '7px 0' }}>
                                Extension pending
                              </span>
                            )}

                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to unclaim this task? You will not be able to reclaim it for 30 days.')) {
                                  handleUnclaim(task.id)
                                }
                              }}
                              style={{ fontSize: 11, padding: '7px 14px', borderRadius: 9999, border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: '#8B7EC8', fontFamily: 'Switzer, sans-serif', cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = '#FCA5A5'; el.style.borderColor = 'rgba(239,68,68,0.4)'; el.style.background = 'rgba(239,68,68,0.06)' }}
                              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.color = '#8B7EC8'; el.style.borderColor = 'rgba(239,68,68,0.2)'; el.style.background = 'transparent' }}
                            >
                              Unclaim
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => setShowForm(true)}
                className="flex flex-col gap-3 p-6 rounded-2xl border text-left"
                style={{
                  background: 'linear-gradient(135deg,#13101E,#160F2A)',
                  borderColor: '#6D28D9',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.3s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(109,40,217,0.2)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(109,40,217,0.15)', border: '1px solid rgba(109,40,217,0.3)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M9 3v12M3 9h12" />
                  </svg>
                </div>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>
                  Submit a contribution
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12, color: '#7B6FA8', lineHeight: 1.6 }}>
                  Record completed work for core team verification and point allocation.
                </p>
              </button>

              <Link
                href="/contribute/tasks"
                className="flex flex-col gap-3 p-6 rounded-2xl border"
                style={{ background: '#13101E', borderColor: '#1C1730', textDecoration: 'none', transition: 'border-color 0.3s' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#6B5FA0')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#1C1730')}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(109,40,217,0.1)', border: '1px solid rgba(109,40,217,0.2)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#7B6FA8" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="2" y="2" width="14" height="14" rx="2" />
                    <path d="M6 7h6M6 11h4" />
                  </svg>
                </div>
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>
                  Browse open tasks
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12, color: '#7B6FA8', lineHeight: 1.6 }}>
                  Find work that matches your skills and availability.
                </p>
              </Link>
            </div>

            {/* Recent contributions */}
            {contributions.length > 0 && (
              <div>
                <p className="mb-4" style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 15, color: '#E8E6F0' }}>
                  Recent submissions
                </p>
                <div className="flex flex-col gap-3">
                  {contributions.slice(0, 3).map((c) => {
                    const sc = STATUS_COLOURS[c.status]
                    const cc = CATEGORY_COLOURS[c.category] ?? '#A78BFA'
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-4 p-4 rounded-xl border"
                        style={{ background: '#13101E', borderColor: '#1C1730' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 13, color: '#E8E6F0', marginBottom: 3 }}>
                            {c.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: cc, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              {c.category}
                            </span>
                            <span style={{ color: '#6B5FA0' }}>·</span>
                            <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: '#8B7EC8', textTransform: 'capitalize' }}>
                              {c.complexity}
                            </span>
                          </div>
                        </div>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            background: sc.bg,
                            color: sc.text,
                            border: `1px solid ${sc.border}`,
                            fontFamily: 'Switzer, sans-serif',
                            fontSize: 9,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.status.replace('_', ' ')}
                        </span>
                        <span style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: cc, flexShrink: 0 }}>
                          {c.final_points ?? c.base_points} pts
                        </span>
                      </div>
                    )
                  })}
                </div>
                {contributions.length > 3 && (
                  <button
                    onClick={() => setTab('contributions')}
                    style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#6D28D9', marginTop: 12, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    View all {contributions.length} contributions
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contributions tab */}
        {tab === 'contributions' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#8B7EC8' }}>
                {contributions.length} submission{contributions.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary"
                style={{ fontSize: 12, padding: '8px 18px' }}
              >
                New submission
              </button>
            </div>
            {contributions.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 rounded-2xl border"
                style={{ background: '#13101E', borderColor: '#1C1730' }}
              >
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: '#E8E6F0', marginBottom: 6 }}>
                  No submissions yet
                </p>
                <p style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 13, color: '#8B7EC8', marginBottom: 16 }}>
                  Submit your first contribution to start earning points
                </p>
                <button onClick={() => setShowForm(true)} className="btn-primary" style={{ fontSize: 12 }}>
                  Submit contribution
                </button>
              </div>
            ) : (
              contributions.map((c) => {
                const sc = STATUS_COLOURS[c.status]
                const cc = CATEGORY_COLOURS[c.category] ?? '#A78BFA'
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-4 p-5 rounded-xl border"
                    style={{ background: '#13101E', borderColor: '#1C1730' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 14, color: '#E8E6F0', marginBottom: 4 }}>
                        {c.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: cc, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {c.category}
                        </span>
                        <span style={{ color: '#6B5FA0' }}>·</span>
                        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: '#8B7EC8', textTransform: 'capitalize' }}>
                          {c.complexity}
                        </span>
                        <span style={{ color: '#6B5FA0' }}>·</span>
                        <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 10, color: '#8B7EC8' }}>
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: sc.bg,
                        color: sc.text,
                        border: `1px solid ${sc.border}`,
                        fontFamily: 'Switzer, sans-serif',
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                    <div className="text-right flex-shrink-0">
                      <div style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: cc, lineHeight: 1 }}>
                        {c.final_points ?? c.base_points}
                      </div>
                      <div style={{ fontFamily: 'Switzer, sans-serif', fontSize: 9, color: '#8B7EC8', marginTop: 2 }}>pts</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="flex flex-col gap-4">
            {[
              { label: 'Full name',          value: contributor.name },
              { label: 'Email',              value: contributor.email },
              { label: 'Categories', value: contributor.categories?.join(', ') },
              { label: 'Contributor type',   value: contributor.contributor_type },
              { label: 'Team name',          value: contributor.team_name },
              { label: 'Location',           value: contributor.location },
              { label: 'Timezone',           value: contributor.timezone },
              { label: 'Availability',       value: contributor.availability_hours_per_week ? `${contributor.availability_hours_per_week} hrs/week` : null },
              { label: 'GitHub',             value: contributor.github_handle },
              { label: 'Twitter',            value: contributor.twitter_handle },
              { label: 'LinkedIn',           value: contributor.linkedin_url },
              { label: 'Portfolio',          value: contributor.portfolio_url },
              { label: 'Skills',             value: contributor.skills?.join(', ') },
              { label: 'Bio',                value: contributor.bio },
              { label: 'Wallet address',     value: contributor.wallet_address },
            ].filter(f => f.value).map((f) => (
              <div
                key={f.label}
                className="grid grid-cols-3 gap-4 p-4 rounded-xl border items-start"
                style={{ background: '#13101E', borderColor: '#1C1730' }}
              >
                <span style={{ fontFamily: 'Switzer, sans-serif', fontSize: 12, color: '#8B7EC8' }}>
                  {f.label}
                </span>
                <span
                  className="col-span-2"
                  style={{ fontFamily: 'Switzer, sans-serif', fontSize: 13, color: '#E8E6F0', wordBreak: 'break-all' }}
                >
                  {f.value}
                </span>
              </div>
            ))}
            <ProfileEditForm contributor={contributor} onSave={(updated) => setContributor(updated)} />
          </div>
        )}

        {/* Submit contribution modal */}
        {showForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(13,11,20,0.92)', backdropFilter: 'blur(16px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}
          >
            <div
              className="w-full max-w-lg rounded-2xl border p-8"
              style={{ background: '#13101E', borderColor: '#1C1730' }}
            >
              <div className="flex items-center justify-between mb-6">
                <p style={{ fontFamily: 'Cabinet Grotesk, sans-serif', fontWeight: 600, fontSize: 18, color: '#E8E6F0' }}>
                  Submit a contribution
                </p>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ color: '#8B7EC8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitContribution} className="flex flex-col gap-4">
                {/* Title */}
                <div>
                  <label style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="What did you build or complete?"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: '#0D0B14', border: '1px solid #1C1730',
                      borderRadius: 8, color: '#E8E6F0',
                      fontFamily: 'Switzer, sans-serif', fontSize: 13, outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what you did, why it matters, and how it contributes to Zivana."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    rows={4}
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: '#0D0B14', border: '1px solid #1C1730',
                      borderRadius: 8, color: '#E8E6F0',
                      fontFamily: 'Switzer, sans-serif', fontSize: 13,
                      outline: 'none', resize: 'vertical',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                </div>

                {/* Category and complexity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px',
                        background: '#0D0B14', border: '1px solid #1C1730',
                        borderRadius: 8, color: '#E8E6F0',
                        fontFamily: 'Switzer, sans-serif', fontSize: 13, outline: 'none',
                      }}
                    >
                      {['technical', 'design', 'community', 'research', 'operations'].map((c) => (
                        <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Complexity
                    </label>
                    <select
                      value={form.complexity}
                      onChange={(e) => setForm({ ...form, complexity: e.target.value })}
                      style={{
                        width: '100%', padding: '10px 14px',
                        background: '#0D0B14', border: '1px solid #1C1730',
                        borderRadius: 8, color: '#E8E6F0',
                        fontFamily: 'Switzer, sans-serif', fontSize: 13, outline: 'none',
                      }}
                    >
                      {['small', 'medium', 'large'].map((c) => (
                        <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Evidence URL */}
                <div>
                  <label style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#8B7EC8', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Evidence URL <span style={{ color: '#6B5FA0', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="GitHub PR, Figma file, Google Doc, tweet..."
                    value={form.evidence_url}
                    onChange={(e) => setForm({ ...form, evidence_url: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px',
                      background: '#0D0B14', border: '1px solid #1C1730',
                      borderRadius: 8, color: '#E8E6F0',
                      fontFamily: 'Switzer, sans-serif', fontSize: 13, outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#6D28D9')}
                    onBlur={(e) => (e.target.style.borderColor = '#1C1730')}
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex-1 justify-center"
                    style={{ opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? 'Submitting...' : 'Submit for review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-outline"
                    style={{ fontSize: 13 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}