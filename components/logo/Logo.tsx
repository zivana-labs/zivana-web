interface LogoProps {
  config?: 'horizontal' | 'icon' | 'stacked'
  size?: number
  showProtocol?: boolean
  className?: string
  lightMark?: boolean
}

export default function Logo({
  config = 'horizontal',
  size = 1,
  showProtocol = false,
  className = '',
  lightMark = false,
}: LogoProps) {

  const Mark = ({ s = 1 }: { s?: number }) => (
    <svg
      width={72 * s}
      height={64 * s}
      viewBox="0 0 72 64"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`markG1_${config}_${s}`} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={lightMark ? '#7C3AED' : '#A78BFA'} />
          <stop offset="100%" stopColor={lightMark ? '#4C1D95' : '#6D28D9'} />
        </linearGradient>
        <linearGradient id={`markG2_${config}_${s}`} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={lightMark ? '#6D28D9' : '#7C3AED'} />
          <stop offset="100%" stopColor={lightMark ? '#4C1D95' : '#4C1D95'} />
        </linearGradient>
      </defs>
      {/* Tertiary arc — 32% opacity */}
      <path
        d="M0 60 A36 36 0 0 1 72 60"
        stroke={`url(#markG2_${config}_${s})`}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        opacity="0.32"
      />
      {/* Secondary arc — 62% opacity */}
      <path
        d="M5 53 A31 31 0 0 1 67 53"
        stroke={`url(#markG2_${config}_${s})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.62"
      />
      {/* Primary arc — full opacity */}
      <path
        d="M14 46 A22 22 0 0 1 58 46"
        stroke={`url(#markG1_${config}_${s})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Apex dot — connected just above primary arc peak */}
      <circle cx="36" cy="12" r="4.5" fill={`url(#markG1_${config}_${s})`} />
    </svg>
  )

  if (config === 'icon') {
    return (
      <div className={className} aria-label="Zivana Protocol">
        <Mark s={size} />
      </div>
    )
  }

  if (config === 'stacked') {
    return (
      <div
        className={`flex flex-col items-center ${className}`}
        style={{ gap: 14 * size }}
        aria-label="Zivana Protocol"
      >
        <Mark s={size} />
        <div className="flex flex-col items-center" style={{ gap: 5 * size }}>
          <span
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: 20 * size,
              letterSpacing: '0.1em',
              color: '#E8E6F0',
              lineHeight: 1,
            }}
          >
            ZIVANA
          </span>
          {showProtocol && (
            <span
              style={{
                fontFamily: 'Switzer, sans-serif',
                fontWeight: 500,
                fontSize: 8.5 * size,
                letterSpacing: '0.38em',
                color: '#8B7EC8',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              PROTOCOL
            </span>
          )}
        </div>
      </div>
    )
  }

  // Horizontal — wordmark vertically centred on icon bounding box
  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap: 14 * size }}
      aria-label="Zivana Protocol"
    >
      <Mark s={size} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: 64 * size,
          gap: showProtocol ? 6 * size : 0,
        }}
      >
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 22 * size,
            letterSpacing: '0.1em',
            color: '#E8E6F0',
            lineHeight: 1,
          }}
        >
          ZIVANA
        </span>
        {showProtocol && (
          <span
            style={{
              fontFamily: 'Switzer, sans-serif',
              fontWeight: 500,
              fontSize: 8.5 * size,
              letterSpacing: '0.38em',
              color: '#8B7EC8',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            PROTOCOL
          </span>
        )}
      </div>
    </div>
  )
}