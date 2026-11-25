import { useId } from 'react'
import { cn } from '@/lib/utils'

/* SENTINELA AI brand mark: faceted shield, silver "S", orbital ring and node. */

export function LogoMark({ size = 40, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const metal = `metal-${id}`
  const metalDeep = `metalDeep-${id}`
  const blue = `blue-${id}`
  const glow = `glow-${id}`
  const blueGlow = `blueGlow-${id}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      role="img"
      aria-label="SENTINELA AI"
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={metal} x1="20" y1="8" x2="78" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#dfe7f1" />
          <stop offset="0.62" stopColor="#9fb0c6" />
          <stop offset="0.82" stopColor="#f2f6fb" />
          <stop offset="1" stopColor="#8c9bb0" />
        </linearGradient>
        <linearGradient id={metalDeep} x1="24" y1="14" x2="72" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16233b" />
          <stop offset="0.55" stopColor="#0a1220" />
          <stop offset="1" stopColor="#050a12" />
        </linearGradient>
        <linearGradient id={blue} x1="10" y1="70" x2="88" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0aa6ff" />
          <stop offset="0.5" stopColor="#3fd2ff" />
          <stop offset="1" stopColor="#1d63ed" />
        </linearGradient>
        <filter id={glow} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={blueGlow} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Shield */}
      <path
        d="M48 5.5 83.5 19v34.4c0 18.3-15.1 30.9-35.5 38.6C27.6 84.3 12.5 71.7 12.5 53.4V19L48 5.5Z"
        fill={`url(#${metalDeep})`}
        stroke={`url(#${metal})`}
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      {/* Inner facet */}
      <path
        d="M48 12.6 77.2 23.7v29.4c0 15.3-12.4 26.2-29.2 33-16.8-6.8-29.2-17.7-29.2-33V23.7L48 12.6Z"
        fill="none"
        stroke="#dbe6f5"
        strokeOpacity="0.16"
        strokeWidth="1.4"
      />

      {/* Silver S */}
      <path
        d="M63 33.5H43.5a8.7 8.7 0 0 0 0 17.4h11a8.7 8.7 0 0 1 0 17.4H31.5"
        stroke={`url(#${metal})`}
        strokeWidth="8.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glow})`}
      />

      {/* Sparkle */}
      <path
        d="M60 66.5 61.5 70.5 65.5 72 61.5 73.5 60 77.5 58.5 73.5 54.5 72 58.5 70.5 60 66.5Z"
        fill="#bfe9ff"
        opacity="0.95"
        filter={`url(#${glow})`}
      />

      {/* Orbit */}
      <g transform="rotate(-26 48 48)">
        <ellipse fill="none"
          cx="48"
          cy="48"
          rx="44.5"
          ry="14.5"
          stroke={`url(#${blue})`}
          strokeOpacity="0.55"
          strokeWidth="5"
          filter={`url(#${blueGlow})`}
        />
        <ellipse fill="none" cx="48" cy="48" rx="44.5" ry="14.5" stroke={`url(#${blue})`} strokeWidth="1.9" />
      </g>

      {/* Orbital node */}
      <g filter={`url(#${blueGlow})`}>
        <circle cx="81.5" cy="26" r="5.4" fill={`url(#${blue})`} />
        <circle cx="81.5" cy="26" r="2.1" fill="#eaf9ff" />
      </g>

      {animated && (
        <circle r="1.6" fill="#8fe4ff" opacity="0.9">
          <animateMotion dur="9s" repeatCount="indefinite" path="M4 62 A44.5 14.5 -26 1 1 92 34" />
        </circle>
      )}
    </svg>
  )
}

type LogoProps = {
  className?: string
  markSize?: number
  tagline?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

const wordmarkSize = {
  sm: 'text-[15px]',
  md: 'text-[19px]',
  lg: 'text-[26px]',
}

export function Logo({ className, markSize = 38, tagline = false, size = 'md', animated = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <LogoMark size={markSize} animated={animated} />
      <div className="leading-none">
        <div className={cn('flex items-baseline gap-1.5 font-extrabold tracking-[0.16em]', wordmarkSize[size])}>
          <span className="bg-gradient-to-b from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">SENTINELA</span>
          <span className="bg-gradient-to-b from-sky-300 via-sky-400 to-blue-600 bg-clip-text text-transparent">AI</span>
        </div>
        {tagline && (
          <div className="mt-2 flex items-center gap-2 text-[8px] uppercase tracking-[0.26em] text-slate-400">
            <span className="h-px w-5 bg-gradient-to-r from-transparent to-slate-500" />
            <span className="whitespace-nowrap">From Evidence to Intelligence</span>
            <span className="h-px w-5 bg-gradient-to-l from-transparent to-slate-500" />
          </div>
        )}
      </div>
    </div>
  )
}


