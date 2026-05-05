'use client'

import { useState } from 'react'

const SPLIT = [
  { label: 'Capital providers', pct: '40%', width: '40%', color: '#A78BFA', gradient: 'linear-gradient(90deg,#A78BFA,#6D28D9)' },
  { label: 'Business (net)',    pct: '48%', width: '48%', color: '#5EEAD4', gradient: 'linear-gradient(90deg,#5EEAD4,#0F766E)' },
  { label: 'Agent commission',  pct: '8%',  width: '8%',  color: '#FCD34D', gradient: 'linear-gradient(90deg,#FCD34D,#92400E)' },
  { label: 'Protocol treasury', pct: '4%',  width: '4%',  color: '#8B5CF6', gradient: 'linear-gradient(90deg,#8B5CF6,#4C1D95)' },
]

export default function SovelaCard() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">

      {/* Hint label */}
      <div className="flex items-center gap-2 mb-4">
        <span
          style={{
            fontFamily: 'Switzer, sans-serif',
            fontSize: 11,
            color: '#4A3E7A',
            letterSpacing: '0.06em',
          }}
        >
          Hover to see distribution
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="#4A3E7A" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
        </svg>
      </div>

      {/* Covenant card */}
      <div
        className="relative rounded-2xl border overflow-hidden cursor-pointer"
        style={{
          background: '#13101E',
          borderColor: expanded ? '#6D28D9' : '#1C1730',
          transition: 'border-color 0.4s ease',
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Top glow on hover */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%,rgba(109,40,217,0.12),transparent 60%)',
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
          }}
        />

        <div className="relative z-10 p-6">
          {/* Card header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#4A3E7A',
                  marginBottom: 5,
                }}
              >
                Active covenant
              </p>
              <p
                style={{
                  fontFamily: 'Cabinet Grotesk, sans-serif',
                  fontWeight: 600,
                  fontSize: 18,
                  color: '#E8E6F0',
                  lineHeight: 1.2,
                }}
              >
                Adunola Textiles
              </p>
              <p
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontSize: 12,
                  color: '#4A3E7A',
                  marginTop: 2,
                }}
              >
                Lagos, Balogun Market
              </p>
            </div>
            <div className="text-right">
              <p
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#4A3E7A',
                  marginBottom: 5,
                }}
              >
                Trust score
              </p>
              <p
                style={{
                  fontFamily: 'Cabinet Grotesk, sans-serif',
                  fontWeight: 600,
                  fontSize: 28,
                  color: '#A78BFA',
                  lineHeight: 1,
                }}
              >
                847
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div
              className="flex justify-between mb-2"
              style={{ fontFamily: 'Switzer, sans-serif', fontSize: 11, color: '#4A3E7A' }}
            >
              <span>Covenant progress</span>
              <span>Month 4 of 12</span>
            </div>
            <div
              style={{
                height: 4,
                background: '#1E1640',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '33%',
                  height: '100%',
                  background: 'linear-gradient(90deg,#A78BFA,#6D28D9)',
                  borderRadius: 2,
                }}
              />
            </div>
          </div>

          {/* Distribution split — expands on hover */}
          <div
            style={{
              maxHeight: expanded ? 240 : 0,
              overflow: 'hidden',
              opacity: expanded ? 1 : 0,
              transition: 'max-height 0.5s ease, opacity 0.4s ease',
            }}
          >
            <div
              style={{
                paddingTop: 20,
                borderTop: '1px solid #1C1730',
              }}
            >
              <p
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#4A3E7A',
                  marginBottom: 14,
                }}
              >
                4-way distribution split
              </p>
              <div className="flex flex-col gap-3">
                {SPLIT.map((s, i) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span
                      style={{
                        fontFamily: 'Switzer, sans-serif',
                        fontSize: 11,
                        color: '#7B6FA8',
                        minWidth: 120,
                        flexShrink: 0,
                      }}
                    >
                      {s.label}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        background: '#1E1640',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: expanded ? s.width : '0%',
                          height: '100%',
                          background: s.gradient,
                          borderRadius: 3,
                          transition: `width 0.8s ease ${i * 120}ms`,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: 'Cabinet Grotesk, sans-serif',
                        fontWeight: 600,
                        fontSize: 11,
                        color: s.color,
                        minWidth: 28,
                        textAlign: 'right',
                        opacity: expanded ? 1 : 0,
                        transition: `opacity 0.4s ease ${i * 120 + 400}ms`,
                      }}
                    >
                      {s.pct}
                    </span>
                  </div>
                ))}
              </div>

              {/* Last distribution */}
              <div
                style={{
                  marginTop: 16,
                  padding: '10px 14px',
                  background: 'rgba(109,40,217,0.08)',
                  border: '1px solid rgba(109,40,217,0.2)',
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: 11,
                    color: '#7B6FA8',
                  }}
                >
                  Last distribution:{' '}
                </span>
                <span
                  style={{
                    fontFamily: 'Courier New, monospace',
                    fontSize: 11,
                    color: '#A78BFA',
                  }}
                >
                  ₦847,200 executed on-chain
                </span>
              </div>
            </div>
          </div>

          {/* Card footer */}
          <div
            className="flex justify-between items-center mt-5 pt-5"
            style={{ borderTop: '1px solid #1C1730' }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#4A3E7A',
                  marginBottom: 3,
                }}
              >
                Funded amount
              </p>
              <p
                style={{
                  fontFamily: 'Cabinet Grotesk, sans-serif',
                  fontWeight: 600,
                  fontSize: 16,
                  color: '#E8E6F0',
                }}
              >
                ₦2,400,000
              </p>
            </div>
            <div
              style={{
                padding: '5px 14px',
                background: 'rgba(15,118,110,0.12)',
                border: '1px solid rgba(15,118,110,0.24)',
                borderRadius: 20,
              }}
            >
              <span
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#5EEAD4',
                }}
              >
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}