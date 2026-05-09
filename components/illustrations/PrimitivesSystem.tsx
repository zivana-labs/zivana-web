'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const PRIMITIVES = [
  {
    id: 0,
    name: 'Trust Score',
    namespace: 'ZVN.Trust',
    desc: 'The central primitive. All others feed into or read from the trust score. The holder-owned reputation asset that makes capital access possible.',
    color: '#A78BFA',
    connections: [1, 2, 3, 4],
    x: 50,
    y: 48,
  },
  {
    id: 1,
    name: 'Identity',
    namespace: 'ZVN.Identity',
    desc: 'Every trust event requires a verified DID. Identity is the entry point — without it no attestation can be attributed to a holder.',
    color: '#7DD3FC',
    connections: [0, 2],
    x: 12,
    y: 14,
  },
  {
    id: 2,
    name: 'Covenant',
    namespace: 'ZVN.Covenant',
    desc: 'Covenants require trust scores to activate. Distribution events feed back into trust history automatically.',
    color: '#5EEAD4',
    connections: [0, 3],
    x: 88,
    y: 14,
  },
  {
    id: 3,
    name: 'Distribution',
    namespace: 'ZVN.Distribution',
    desc: 'Every successful distribution adds a covenant fulfilment attestation to the trust score. Completing covenants builds reputation.',
    color: '#FCD34D',
    connections: [0, 2, 4],
    x: 12,
    y: 84,
  },
  {
    id: 4,
    name: 'Intelligence',
    namespace: 'ZVN.Intelligence',
    desc: 'Reads trust score patterns to detect anomalies and score covenant viability. Generates multilingual explanations of trust changes.',
    color: '#C084FC',
    connections: [0, 3],
    x: 88,
    y: 84,
  },
]

export default function PrimitivesSystem() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number>(0)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [pulse, setPulse] = useState<number[]>([])
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Measure container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setDims({ w: el.offsetWidth, h: el.offsetHeight })
    })
    ro.observe(el)
    setDims({ w: el.offsetWidth, h: el.offsetHeight })
    return () => ro.disconnect()
  }, [])

  // Auto-cycle through primitives to hint interactivity
  useEffect(() => {
    const ids = [0, 1, 2, 3, 4]
    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % ids.length
      setActive(ids[index])
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  // Pulse animation on unselected nodes
  useEffect(() => {
    const unselected = PRIMITIVES
      .filter(p => p.id !== active)
      .map(p => p.id)

    // Stagger pulse indicators
    unselected.forEach((id, i) => {
      const t = setTimeout(() => {
        setPulse(prev => [...prev, id])
        setTimeout(() => {
          setPulse(prev => prev.filter(p => p !== id))
        }, 1000)
      }, i * 300)
    })

    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current)
    }
  }, [active])

  const getPos = useCallback((p: typeof PRIMITIVES[0], w: number, h: number) => {
    // On mobile use a tighter layout
    const isMobile = w < 400
    const padX = isMobile ? 16 : 24
    const padY = isMobile ? 16 : 20
    return {
      x: padX + (p.x / 100) * (w - padX * 2),
      y: padY + (p.y / 100) * (h - padY * 2),
    }
  }, [])

  const isConnected = (id: number) =>
    active === id || PRIMITIVES[active].connections.includes(id)

  const isLineActive = (a: number, b: number) =>
    (active === a && PRIMITIVES[active].connections.includes(b)) ||
    (active === b && PRIMITIVES[active].connections.includes(a))

  const nodeSize = (id: number) => {
    if (dims.w < 400) return id === 0 ? 64 : 52
    return id === 0 ? 88 : 68
  }

  const fontSize = (id: number) => {
    if (dims.w < 400) return id === 0 ? 7 : 6.5
    return id === 0 ? 9 : 8
  }

  return (
    <div className="w-full flex flex-col gap-5">

      {/* Hint label */}
      <div className="flex items-center justify-center gap-2">
        <span
          style={{
            fontFamily: 'Switzer, sans-serif',
            fontSize: 11,
            color: '#6B5FA0',
            letterSpacing: '0.06em',
          }}
        >
          Click any node to explore
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="#8B7EC8" strokeWidth="1" />
          <path d="M4 5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2" stroke="#8B7EC8" strokeWidth="1" strokeLinecap="round" />
          <circle cx="6" cy="9" r="0.8" fill="#8B7EC8" />
        </svg>
      </div>

      {/* Diagram */}
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: dims.w < 400 ? 300 : 380 }}
      >
        {/* SVG connection lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          <defs>
            {PRIMITIVES.map(p => (
              <marker
                key={p.id}
                id={`arrow-${p.id}`}
                viewBox="0 0 8 8"
                refX="4"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
              >
                <path d="M0 0 L8 4 L0 8 z" fill={p.color} opacity="0.6" />
              </marker>
            ))}
          </defs>

          {dims.w > 0 && PRIMITIVES.map((p) =>
            p.connections.map((cId) => {
              if (cId <= p.id) return null
              const from = getPos(p, dims.w, dims.h)
              const to = getPos(PRIMITIVES[cId], dims.w, dims.h)
              const lit = isLineActive(p.id, cId)
              const activeColor = PRIMITIVES[active].color

              return (
                <line
                  key={`${p.id}-${cId}`}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke={lit ? activeColor : '#6B5FA0'}
                  strokeWidth={lit ? 1.8 : 1}
                  opacity={lit ? 0.8 : 0.35}
                  strokeDasharray={lit ? 'none' : '4 4'}
                  style={{ transition: 'all 0.4s ease' }}
                />
              )
            })
          )}
        </svg>

        {/* Nodes */}
        {dims.w > 0 && PRIMITIVES.map((p) => {
          const pos = getPos(p, dims.w, dims.h)
          const isCentre = p.id === 0
          const isActive = active === p.id
          const connected = isConnected(p.id)
          const isPulsing = pulse.includes(p.id)
          const size = nodeSize(p.id)
          const fSize = fontSize(p.id)

          return (
            <div
              key={p.id}
              className="absolute flex flex-col items-center gap-1.5 cursor-pointer"
              style={{
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
                zIndex: isActive ? 20 : 10,
              }}
              onClick={() => setActive(p.id)}
            >
              {/* Pulse ring — hints at interactivity */}
              {!isActive && (
                <div
                  style={{
                    position: 'absolute',
                    width: size + 20,
                    height: size + 20,
                    borderRadius: '50%',
                    border: `1px solid ${p.color}`,
                    opacity: isPulsing ? 0.5 : 0,
                    transform: isPulsing ? 'scale(1.3)' : 'scale(1)',
                    transition: 'opacity 0.6s ease, transform 0.6s ease',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Active glow ring */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    width: size + 16,
                    height: size + 16,
                    borderRadius: '50%',
                    border: `2px solid ${p.color}`,
                    opacity: 0.4,
                    pointerEvents: 'none',
                    animation: 'activeRing 2s ease-in-out infinite',
                  }}
                />
              )}

              {/* Node circle */}
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  background: isActive
                    ? `radial-gradient(circle, ${p.color}25, #13101E)`
                    : isCentre
                    ? `linear-gradient(135deg, #A78BFA, #6D28D9)`
                    : '#13101E',
                  border: `${isActive ? 2 : 1}px solid ${connected ? p.color : '#6B5FA0'}`,
                  boxShadow: isActive
                    ? `0 0 28px ${p.color}55`
                    : isCentre
                    ? `0 0 40px rgba(167,139,250,0.3)`
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.35s ease',
                  opacity: connected ? 1 : 0.3,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Switzer, sans-serif',
                    fontSize: fSize,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    color: isActive
                      ? p.color
                      : isCentre
                      ? '#ffffff'
                      : '#C4B5FD',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    textTransform: 'uppercase',
                    padding: '0 6px',
                    transition: 'color 0.35s ease',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {p.name.replace(' ', '\n')}
                </span>
              </div>

              {/* Namespace label — always visible with good contrast */}
              <span
                style={{
                  fontFamily: 'Courier New, monospace',
                  fontSize: dims.w < 400 ? 7.5 : 9,
                  color: isActive ? p.color : '#6B5FA0',
                  transition: 'color 0.35s ease',
                  whiteSpace: 'nowrap',
                  background: '#0D0B14',
                  padding: '1px 4px',
                  borderRadius: 3,
                }}
              >
                {p.namespace}
              </span>
            </div>
          )
        })}
      </div>

      {/* Info panel */}
      <div
        style={{
          padding: '18px 22px',
          background: '#0F0D1A',
          border: `1px solid ${PRIMITIVES[active].color}35`,
          borderRadius: 14,
          minHeight: 88,
          transition: 'border-color 0.4s ease',
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: PRIMITIVES[active].color,
              display: 'inline-block',
              flexShrink: 0,
              boxShadow: `0 0 8px ${PRIMITIVES[active].color}`,
            }}
          />
          <span
            style={{
              fontFamily: 'Cabinet Grotesk, sans-serif',
              fontWeight: 600,
              fontSize: 14,
              color: PRIMITIVES[active].color,
            }}
          >
            {PRIMITIVES[active].name}
          </span>
          <span
            style={{
              fontFamily: 'Courier New, monospace',
              fontSize: 10,
              color: '#8B7EC8',
            }}
          >
            {PRIMITIVES[active].namespace}
          </span>
        </div>
        <p
          style={{
            fontFamily: 'Switzer, sans-serif',
            fontWeight: 300,
            fontSize: 13,
            color: '#7B6FA8',
            lineHeight: 1.68,
          }}
        >
          {PRIMITIVES[active].desc}
        </p>
      </div>

      <style jsx>{`
        @keyframes activeRing {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.15; transform: scale(1.15); }
        }
      `}</style>

    </div>
  )
}