import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { AuthCard, AuthInput, AuthNotice, AuthShell } from '@/components/auth/AuthShell'

export default function ResetPasswordPage() {
  const { t, translateError } = useI18n()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('auth.reset.mismatch'))
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      setDone(true)
    } catch (err: any) {
      setError(translateError(err?.response?.data?.detail) || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell headline={t('auth.reset.headline')} subtitle={t('auth.reset.headlineSubtitle')}>
      <AuthCard>
        <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white">
          <ArrowLeft size={13} /> {t('auth.reset.back')}
        </Link>

        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('auth.reset.title')}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{t('auth.reset.subtitle')}</p>

        {!token && (
          <div className="mt-6 space-y-4">
            <AuthNotice>{t('auth.reset.missingToken')}</AuthNotice>
            <Link
              to="/forgot-password"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              {t('auth.forgot.title')} <ArrowRight size={15} />
            </Link>
          </div>
        )}

        {token && !done && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="relative">
              <AuthInput
                label={t('auth.reset.password')}
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••••"
                className="pl-10 pr-11"
              />
              <Lock size={15} className="pointer-events-none absolute bottom-[15px] left-3.5 text-slate-500" />
              <button
                type="button"
                onClick={() => setShow(v => !v)}
                aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
                className="absolute bottom-[11px] right-3 rounded-md p-1 text-slate-500 transition hover:text-white"
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <AuthInput
              label={t('auth.reset.confirm')}
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="••••••••••"
            />

            <p className="text-[11px] leading-relaxed text-slate-500">{t('auth.reset.hint')}</p>

            {error && <AuthNotice>{error}</AuthNotice>}

            <button
              type="submit"
              disabled={loading}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t('auth.reset.submitting') : (
                <>
                  <KeyRound size={15} />
                  {t('auth.reset.submit')}
                </>
              )}
            </button>
          </form>
        )}

        {done && (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              <span>{t('auth.reset.success')}</span>
            </div>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
            >
              {t('auth.reset.goSignIn')} <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  )
}
