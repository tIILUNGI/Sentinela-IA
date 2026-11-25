import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Copy, Mail } from 'lucide-react'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { AuthCard, AuthInput, AuthNotice, AuthShell } from '@/components/auth/AuthShell'

type Result = { message: string; reset_url?: string | null }

export default function ForgotPasswordPage() {
  const { t, translateError } = useI18n()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setResult(data)
    } catch (err: any) {
      setError(translateError(err?.response?.data?.detail) || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const copy = async () => {
    if (!result?.reset_url) return
    try {
      await navigator.clipboard.writeText(result.reset_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <AuthShell headline={t('auth.forgot.headline')} subtitle={t('auth.forgot.headlineSubtitle')}>
      <AuthCard>
        <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white">
          <ArrowLeft size={13} /> {t('auth.forgot.back')}
        </Link>

        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('auth.forgot.title')}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{t('auth.forgot.subtitle')}</p>

        {!result && (
          <form onSubmit={submit} className="mt-6 space-y-4">
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

            {error && <AuthNotice>{error}</AuthNotice>}

            <button
              type="submit"
              disabled={loading}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? t('auth.forgot.submitting') : (
                <>
                  {t('auth.forgot.submit')}
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <p className="text-[11px] leading-relaxed text-slate-500">{t('auth.forgot.privacy')}</p>
          </form>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <AuthNotice tone="success">{result.message}</AuthNotice>

            {result.reset_url ? (
              <div className="space-y-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] p-4">
                <p className="text-xs leading-relaxed text-sky-100/80">{t('auth.forgot.devNotice')}</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={result.reset_url}
                    onFocus={e => e.currentTarget.select()}
                    className="w-full truncate rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-[11px] text-slate-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={copy}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-[11px] font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    {copied ? t('auth.forgot.copied') : t('auth.forgot.copy')}
                  </button>
                </div>
                <Link
                  to={result.reset_url.replace(/^https?:\/\/[^/]+/, '')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200"
                >
                  {t('auth.forgot.openLink')}
                  <ArrowRight size={15} />
                </Link>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-slate-500">{t('auth.forgot.emailSent')}</p>
            )}

            <button
              type="button"
              onClick={() => { setResult(null); setEmail('') }}
              className="w-full rounded-full border border-white/12 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            >
              {t('auth.forgot.tryAnother')}
            </button>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  )
}
