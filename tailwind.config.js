/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void:     '#0D0B14',
        depth:    '#13101E',
        shadow:   '#1E1640',
        border:   '#1C1730',
        dp:       '#4C1D95',
        core:     '#6D28D9',
        violet:   '#8B5CF6',
        lavender: '#A78BFA',
        mist:     '#C4B5FD',
        light:    '#E8E6F0',
        mute:     '#7B6FA8',
        label:    '#4A3E7A',
        faint:    '#2D2450',
      },
      fontFamily: {
  cabinet: ['Cabinet Grotesk', 'sans-serif'],
  switzer: ['Switzer', 'sans-serif'],
  mono:    ['Fira Code', 'monospace'],
  syne:    ['Syne', 'sans-serif'],
},
      animation: {
        'float-1':    'float1 12s ease-in-out infinite',
        'float-2':    'float2 16s ease-in-out infinite',
        'float-3':    'float3 20s ease-in-out infinite',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'spin-slow':  'spinSlow 40s linear infinite',
      },
      keyframes: {
        float1: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(-60px,40px) scale(1.08)' },
          '66%':     { transform: 'translate(40px,-30px) scale(0.95)' },
        },
        float2: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(80px,-60px) scale(1.12)' },
        },
        float3: {
          '0%,100%': { opacity: '0.07', transform: 'scale(1)' },
          '50%':     { opacity: '0.03', transform: 'scale(1.3)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%':     { opacity: '0.4', transform: 'scale(0.7)' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}