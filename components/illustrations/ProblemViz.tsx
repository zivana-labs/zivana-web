'use client'

import { useEffect, useRef, useState } from 'react'

export default function ProblemViz() {
  const ref = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Ensure starting state is applied before observer runs
    const timer = setTimeout(() => {
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          setAnimated(true)
          obs.disconnect()
        }
      }, { threshold: 0.25, rootMargin: '0px 0px -80px 0px' })
      obs.observe(el)
      return () => obs.disconnect()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div ref={ref} className="flex flex-col items-center gap-8 w-full">

      {/* Bar chart */}
      <div className="w-full max-w-sm">
        <div
          className="flex items-end gap-3 justify-center"
          style={{ height: 220 }}
        >
          {/* Capital bar */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <span
              style={{
                fontFamily: 'Cabinet Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: 16,
                color: '#A78BFA',
                opacity: animated ? 1 : 0,
                transition: 'opacity 0.6s ease 0.8s',
              }}
            >
              $1.2T+
            </span>
            <div
              style={{
                width: '100%',
                background: 'linear-gradient(180deg,#A78BFA,#6D28D9)',
                borderRadius: '8px 8px 0 0',
                height: animated ? 160 : 0,
                transition: 'height 1.4s cubic-bezier(0.34,1.56,0.64,1) 0.2s',
                willChange: 'height',
                minHeight: 0,
              }}
            />
          </div>

          {/* Gap indicator */}
          <div
            className="flex flex-col items-center justify-center gap-2"
            style={{ width: 80, height: '100%' }}
          >
            <div
              style={{
                background: '#13101E',
                border: '1px solid #1C1730',
                borderRadius: 10,
                padding: '10px 12px',
                textAlign: 'center',
                opacity: animated ? 1 : 0,
                transition: 'opacity 0.6s ease 1.2s',
              }}
            >
              <div
                style={{
                  fontFamily: 'Cabinet Grotesk, sans-serif',
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#E8E6F0',
                  lineHeight: 1,
                }}
              >
                $1.8T
              </div>
              <div
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontSize: 9,
                  color: '#8B7EC8',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginTop: 3,
                }}
              >
                Africa gap
              </div>
            </div>
            <svg
              width="48"
              height="20"
              viewBox="0 0 48 20"
              fill="none"
              style={{
                opacity: animated ? 0.5 : 0,
                transition: 'opacity 0.6s ease 1.4s',
              }}
            >
              <path
                d="M4 10 L44 10"
                stroke="#6D28D9"
                strokeWidth="1"
                strokeDasharray="4 3"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-14"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
              <path
                d="M38 5 L44 10 L38 15"
                stroke="#6D28D9"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Informal economy bar */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <span
              style={{
                fontFamily: 'Cabinet Grotesk, sans-serif',
                fontWeight: 600,
                fontSize: 16,
                color: '#5EEAD4',
                opacity: animated ? 1 : 0,
                transition: 'opacity 0.6s ease 0.8s',
              }}
            >
              $3T+
            </span>
            <div
              style={{
                width: '100%',
                background: 'linear-gradient(180deg,#5EEAD4,#0F766E)',
                borderRadius: '8px 8px 0 0',
                height: animated ? 200 : 0,
                transition: 'height 1.4s cubic-bezier(0.34,1.56,0.64,1) 0.35s',
                willChange: 'height',
                minHeight: 0,
              }}
            />
          </div>
        </div>

        {/* Floor line */}
        <div
          style={{
            height: 1,
            background: 'linear-gradient(90deg,transparent,#1C1730,transparent)',
          }}
        />

        {/* Bar labels */}
        <div className="flex justify-between mt-3 px-2">
          <span
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontSize: 11,
              color: '#8B7EC8',
            }}
          >
            Available capital
          </span>
          <span
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontSize: 11,
              color: '#8B7EC8',
            }}
          >
            Informal economy
          </span>
        </div>
      </div>

      {/* Bridge label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          maxWidth: 360,
          opacity: animated ? 1 : 0,
          transition: 'opacity 0.6s ease 1.8s',
        }}
      >
        <div
          style={{
            height: 1,
            flex: 1,
            background: 'linear-gradient(90deg,transparent,#6D28D9)',
          }}
        />
        <div
          style={{
            padding: '8px 18px',
            background: 'rgba(109,40,217,0.1)',
            border: '1px solid rgba(109,40,217,0.28)',
            borderRadius: 20,
            fontFamily: 'Switzer, sans-serif',
            fontSize: 11,
            color: '#A78BFA',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          Zivana bridges the gap
        </div>
        <div
          style={{
            height: 1,
            flex: 1,
            background: 'linear-gradient(90deg,#6D28D9,transparent)',
          }}
        />
      </div>

    </div>
  )
}