import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'

function Waves() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 300"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] w-full"
    >
      <defs>
        <linearGradient id="auth-wave-a" x1="0" y1="0" x2="640" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0a4b8a" stopOpacity="0" />
          <stop offset="0.28" stopColor="#2ea8ff" stopOpacity="0.85" />
          <stop offset="0.62" stopColor="#8ce9ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#1d63ed" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="auth-wave-b" x1="0" y1="0" x2="640" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff5a3c" stopOpacity="0.5" />
          <stop offset="0.4" stopColor="#1f7fd4" stopOpacity="0.28" />
          <stop offset="1" stopColor="#0b1220" stopOpacity="0" />
        </linearGradient>
        <filter id="auth-wave-blur" x="-20%" y="-40%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      <g filter="url(#auth-wave-blur)" opacity="0.55">
        <path d="M-40 226C110 118 232 300 386 214S596 96 690 176" stroke="url(#auth-wave-a)" strokeWidth="16" fill="none" />
        <path d="M-40 274C118 186 250 340 404 262S604 168 690 232" stroke="url(#auth-wave-b)" strokeWidth="22" fill="none" />
      </g>
      <g fill="none" strokeLinecap="round">
        <path d="M-40 226C110 118 232 300 386 214S596 96 690 176" stroke="url(#auth-wave-a)" strokeWidth="1.4" />
        <path d="M-40 246C110 138 232 320 386 234S596 116 690 196" stroke="url(#auth-wave-a)" strokeWidth="1" opacity="0.65" />
        <path d="M-40 264C110 156 232 338 386 252S596 134 690 214" stroke="url(#auth-wave-a)" strokeWidth="0.8" opacity="0.4" />
        <path d="M-40 196C118 92 244 268 398 182S606 62 690 142" stroke="url(#auth-wave-b)" strokeWidth="1.2" opacity="0.8" />
      </g>
    </svg>
  )
}

type Props = {
  children: React.ReactNode
  /** Optional headline override for the brand panel */
  headline?: string
  subtitle?: string
}

export function AuthShell({ children, headline, subtitle }: Props) {
  const { t } = useI18n()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050607] text-white">
      {/* Ambient light */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-22%] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-[140px]" />
        <div className="absolute -left-40 bottom-[-10%] h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, #000 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 35%, #000 30%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link to="/" className="lg:invisible" aria-label="SENTINELA AI">
            <Logo size="sm" markSize={30} />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher dark />
            <Link
              to="/"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" />
              {t('auth.shell.back')}
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-5 sm:py-8">
          <div className="w-full max-w-[1120px] overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#060708] shadow-[0_50px_140px_-50px_rgba(0,0,0,0.95)] sm:rounded-[32px]">
            <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
              {/* Brand panel */}
              <div className="relative hidden min-h-[660px] flex-col justify-between overflow-hidden border-r border-white/[0.06] p-10 lg:flex xl:p-12">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_10%,rgba(29,99,237,0.16),transparent_58%)]" />
                <Waves />

                <div className="relative">
                  <Logo tagline markSize={44} />
                </div>

                <div className="relative mt-14">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                    <Sparkles size={11} className="text-sky-400" />
                    {t('auth.shell.badge')}
                  </div>
                  <h2 className="mt-6 text-[54px] font-black leading-[0.95] tracking-[-0.03em] xl:text-[64px]">
                    <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
                      {headline || t('auth.shell.welcome')}
                    </span>
                  </h2>
                  <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
                    {subtitle || t('auth.shell.subtitle')}
                  </p>
                  <Link
                    to="/"
                    className="group mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500/25 via-blue-600/25 to-slate-700/30 px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/15 transition hover:from-sky-500/40 hover:via-blue-600/40"
                  >
                    {t('auth.shell.learnMore')}
                    <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div className="relative flex items-center gap-5 border-t border-white/[0.07] pt-6 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck size={13} className="text-sky-500/80" /> {t('auth.shell.secure')}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> EN / PT
                  </span>
                </div>
              </div>

              {/* Form panel */}
              <div className="relative flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(59,130,246,0.10),transparent_60%)]" />
                <div className="relative w-full max-w-[420px]">{children}</div>
              </div>
            </div>
          </div>
        </main>

        <footer className="flex flex-col items-center justify-between gap-2 pb-1 text-[11px] text-slate-600 sm:flex-row">
          <span>{t('auth.shell.copyright')}</span>
          <span className="uppercase tracking-[0.22em]">{t('auth.shell.tagline')}</span>
        </footer>
      </div>
    </div>
  )
}

export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-white/[0.09] bg-white/[0.045] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:p-8',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function AuthInput({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
        {label}
        {hint}
      </span>
      <input
        {...props}
        className={cn(
          'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600',
          'focus:border-sky-400/60 focus:bg-black/60 focus:ring-4 focus:ring-sky-500/10',
          props.className,
        )}
      />
    </label>
  )
}

export function AuthNotice({ tone = 'error', children }: { tone?: 'error' | 'info' | 'success'; children: React.ReactNode }) {
  const tones = {
    error: 'border-red-500/25 bg-red-500/10 text-red-200',
    info: 'border-sky-500/25 bg-sky-500/10 text-sky-100',
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100',
  }
  return <div className={cn('rounded-xl border px-4 py-3 text-sm leading-relaxed', tones[tone])}>{children}</div>
}
