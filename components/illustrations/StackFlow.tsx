'use client'

import { useEffect, useRef, useState } from 'react'

const LAYERS = [
  {
    layer: 'Settlement',
    tech: 'Cardano + Aiken',
    color: '#1C5F8A',
    labelColor: '#7DD3FC',
    desc: 'eUTxO distribution, $ZVN token, finality',
  },
  {
    layer: 'Privacy',
    tech: 'Midnight + Compact',
    color: '#6D28D9',
    labelColor: '#A78BFA',
    desc: 'Shielded covenants, ZK proofs, selective disclosure',
  },
  {
    layer: 'Identity',
    tech: 'Hyperledger Identus',
    color: '#0F766E',
    labelColor: '#5EEAD4',
    desc: 'DID credentials, verifiable attestations, W3C compliance',
  },
  {
    layer: 'Oracle',
    tech: 'Orcfax + Charli3',
    color: '#92400E',
    labelColor: '#FCD34D',
    desc: 'Revenue attestation, price feeds, audit trail',
  },
  {
    layer: 'Intelligence',
    tech: 'ASI Cloud + Fetch.ai',
    color: '#065F46',
    labelColor: '#6EE7B7',
    desc: 'Market benchmarking, anomaly detection, multilingual',
  },
]

export default function StackFlow() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [activePackets, setActivePackets] = useState<
    { id: number; layerIndex: number; progress: number }[]
  >([])
  const packetIdRef = useRef(0)
  const animFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Intersection trigger
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect() }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Packet animation loop
  useEffect(() => {
    if (!visible) return

    const spawnPacket = () => {
      const layerIndex = Math.floor(Math.random() * LAYERS.length)
      setActivePackets(prev => [
        ...prev.slice(-8),
        { id: packetIdRef.current++, layerIndex, progress: 0 },
      ])
    }

    spawnTimerRef.current = setInterval(spawnPacket, 600)

    const animate = (time: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = time
      const delta = time - lastTimeRef.current
      lastTimeRef.current = time

      setActivePackets(prev =>
        prev
          .map(p => ({ ...p, progress: p.progress + delta * 0.06 }))
          .filter(p => p.progress < 100)
      )
      animFrameRef.current = requestAnimationFrame(animate)
    }
    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [visible])

  return (
    <div ref={ref} className="flex flex-col gap-0 w-full">
      {LAYERS.map((layer, i) => (
        <div key={layer.layer}>
          {/* Layer card */}
          <div
            className="relative flex gap-4 items-center p-5 rounded-xl border overflow-hidden"
            style={{
              background: '#13101E',
              borderColor: `${layer.color}35`,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(24px)',
              transition: `opacity 0.6s ease ${i * 120}ms, transform 0.6s ease ${i * 120}ms`,
            }}
          >
            {/* Subtle layer colour wash */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, ${layer.color}08, transparent)`,
                pointerEvents: 'none',
              }}
            />

            {/* Animated packets travelling across the layer */}
            {activePackets
              .filter(p => p.layerIndex === i)
              .map(p => (
                <div
                  key={p.id}
                  style={{
                    position: 'absolute',
                    left: `${p.progress}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: layer.labelColor,
                    boxShadow: `0 0 8px ${layer.labelColor}`,
                    opacity: Math.min(1, (100 - p.progress) / 20),
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              ))}

            {/* Live indicator dot */}
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: layer.labelColor,
                flexShrink: 0,
                boxShadow: `0 0 8px ${layer.labelColor}80`,
                animation: 'livePulse 2s ease-in-out infinite',
                animationDelay: `${i * 0.4}s`,
              }}
            />

            {/* Layer badge */}
            <span
              style={{
                flexShrink: 0,
                padding: '3px 10px',
                borderRadius: 20,
                background: `${layer.color}18`,
                color: layer.labelColor,
                border: `1px solid ${layer.color}35`,
                fontFamily: 'Switzer, sans-serif',
                fontSize: 9,
                fontWeight: 500,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {layer.layer}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0 relative z-10">
              <p
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontWeight: 500,
                  fontSize: 13,
                  color: '#E8E6F0',
                  marginBottom: 3,
                }}
              >
                {layer.tech}
              </p>
              <p
                style={{
                  fontFamily: 'Switzer, sans-serif',
                  fontWeight: 300,
                  fontSize: 11.5,
                  color: '#7B6FA8',
                  lineHeight: 1.55,
                }}
              >
                {layer.desc}
              </p>
            </div>
          </div>

          {/* Connector between layers */}
          {i < LAYERS.length - 1 && (
            <div className="flex justify-start ml-6 relative" style={{ height: 20 }}>
              <div
                style={{
                  width: 1.5,
                  height: '100%',
                  background: `linear-gradient(180deg, ${layer.color}, ${LAYERS[i + 1].color})`,
                  opacity: 0.4,
                  position: 'relative',
                }}
              >
                {/* Flow dot on connector */}
                <div
                  style={{
                    position: 'absolute',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: layer.labelColor,
                    left: -1.25,
                    animation: 'flowConnector 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}

    </div>
  )
}