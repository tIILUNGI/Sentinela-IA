import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, User, Building2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { AuthCard, AuthInput, AuthNotice, AuthShell } from '@/components/auth/AuthShell'
import { cn } from '@/lib/utils'

type Mode = 'signin' | 'signup'

export default function AuthPage({ mode }: { mode: Mode }) {
  const { user, login, register } = useAuth()
  const { t, translateError } = useI18n()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [org, setOrg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/app" replace />

  const isSignup = mode === 'signup'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignup) await register(name, email, password, org.trim() || undefined)
      else await login(email, password)
      // Navigation is handled by the declarative redirect above once user state is set.
    } catch (err: any) {
      setError(translateError(err?.response?.data?.detail) || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        {/* Mode switch */}
        <div className="mb-7 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-black/40 p-1 text-[13px]">
          {([
            { key: 'signin' as Mode, to: '/login', label: t('auth.tab.signin') },
            { key: 'signup' as Mode, to: '/register', label: t('auth.tab.signup') },
          ]).map(tab => (
            <Link
              key={tab.key}
              to={tab.to}
              className={cn(
                'rounded-full px-4 py-2 text-center font-medium transition',
                mode === tab.key ? 'bg-white text-black shadow-sm' : 'text-slate-400 hover:text-white',
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">
            {isSignup ? t('auth.register.title') : t('auth.login.title')}
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {isSignup ? t('auth.register.subtitle') : t('auth.login.subtitle')}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {isSignup && (
            <AuthInput
              label={t('auth.register.name')}
              value={name}
              onChange={e => setName(e.target.value)}
              required
              minLength={2}
              autoComplete="name"
              placeholder={t('auth.register.namePlaceholder')}
            />
          )}

          <div className="relative">
            <AuthInput
              label={t('auth.login.email')}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="name@organization.com"
              className="pl-10"
            />
            <Mail size={15} className="pointer-events-none absolute bottom-[15px] left-3.5 text-slate-500" />
          </div>

          <div className="relative">
            <AuthInput
              label={t('auth.login.password')}
              hint={
                !isSignup ? (
                  <Link to="/forgot-password" className="text-[10px] font-medium tracking-normal text-sky-400 hover:text-sky-300">
                    {t('auth.login.forgot')}
                  </Link>
                ) : undefined
              }
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              placeholder="••••••••••"
              className="pl-10 pr-11"
            />
            <Lock size={15} className="pointer-events-none absolute bottom-[15px] left-3.5 text-slate-500" />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              className="absolute bottom-[11px] right-3 rounded-md p-1 text-slate-500 transition hover:text-white"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {isSignup && (
            <div className="relative">
              <AuthInput
                label={t('auth.register.orgOptional')}
                value={org}
                onChange={e => setOrg(e.target.value)}
                autoComplete="organization"
                placeholder={t('auth.register.orgPlaceholder')}
                className="pl-10"
              />
              <Building2 size={15} className="pointer-events-none absolute bottom-[15px] left-3.5 text-slate-500" />
            </div>
          )}

          {isSignup && <p className="text-[11px] leading-relaxed text-slate-500">{t('auth.register.hint')}</p>}

          {error && <AuthNotice>{error}</AuthNotice>}

          <button
            type="submit"
            disabled={loading}
            className="group mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (isSignup ? t('auth.register.submitting') : t('auth.login.submitting')) : (
              <>
                {isSignup ? t('auth.register.submit') : t('auth.login.submit')}
                <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {!isSignup && (
          <div className="mt-5 flex flex-col items-center gap-2 text-center text-xs text-slate-500">
            <span>
              {t('auth.login.noAccount')}{' '}
              <Link to="/register" className="font-medium text-sky-400 hover:text-sky-300">
                {t('auth.login.create')}
              </Link>
            </span>
            <button
              type="button"
              onClick={() => {
                setEmail('demo@sentinela.ai')
                setPassword('SentinelaDemo2026!')
                setError('')
              }}
              className="text-[11px] text-slate-600 underline decoration-slate-700 underline-offset-4 transition hover:text-slate-400"
            >
              Demo
            </button>
          </div>
        )}

        {isSignup && (
          <div className="mt-5 text-center text-xs text-slate-500">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">
              {t('auth.register.signIn')}
            </Link>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-slate-600">
          <span className="h-px flex-1 bg-white/[0.08]" />
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={11} /> {t('auth.secure')}
          </span>
          <span className="h-px flex-1 bg-white/[0.08]" />
        </div>
      </AuthCard>

      <p className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-600">
        <User size={11} /> {t('auth.shell.roleNote')}
      </p>
    </AuthShell>
  )
}
