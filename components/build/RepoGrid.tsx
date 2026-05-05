'use client'

import { REPOS } from '@/lib/constants'

export default function RepoGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {REPOS.map((r) => (
        <a
          key={r.name}
          href={`https://github.com/zivana-labs/${r.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-2.5 p-5 rounded-xl border"
          style={{ background: '#13101E', borderColor: '#1C1730', textDecoration: 'none', transition: 'border-color 0.25s, transform 0.25s' }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#6D28D9'; el.style.transform = 'translateY(-2px)' }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#1C1730'; el.style.transform = 'translateY(0)' }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: '#A78BFA' }}>{r.name}</span>
            <span className="px-2 py-0.5 rounded-full" style={{ background: '#1E1640', color: '#4A3E7A', fontFamily: 'Switzer, sans-serif', fontSize: 9, letterSpacing: '0.08em' }}>{r.phase}</span>
          </div>
          <span style={{ fontFamily: 'Switzer, sans-serif', fontWeight: 300, fontSize: 12, color: '#7B6FA8', lineHeight: 1.6 }}>{r.desc}</span>
        </a>
      ))}
    </div>
  )
}
