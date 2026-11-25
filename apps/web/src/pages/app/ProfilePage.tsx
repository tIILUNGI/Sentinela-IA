import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ShieldCheck, KeyRound, Building2, LogOut, UserCheck, Mail, Lock } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ProfilePage() {
  const { user, memberships, orgId, refreshMe, logout } = useAuth()
  const { t, translateError } = useI18n()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name || '')
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const currentOrg = memberships.find(m => m.organization_id === orgId)
  const roleLabel = user?.is_superuser ? t('common.superAdmin') : (currentOrg?.role || '')
  const initials = (user?.name || user?.email || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p[0]?.toUpperCase() || '')
    .join('')

  const pwdStrength = (() => {
    const p = passwords.new_password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
    if (/\d/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const updateProfile = useMutation({
    mutationFn: async () => (await api.patch('/auth/me', { name })).data,
    onSuccess: async () => {
      await refreshMe()
      setProfileMsg({ type: 'ok', text: t('profile.updated') })
    },
    onError: (e: any) => {
      setProfileMsg({ type: 'err', text: translateError(e?.response?.data?.detail) || t('common.error') })
    },
  })

  const changePassword = useMutation({
    mutationFn: async () => {
      if (passwords.new_password !== passwords.confirm_password) {
        throw new Error('MISMATCH')
      }
      return (
        await api.post('/auth/change-password', {
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        })
      ).data
    },
    onSuccess: () => {
      setPasswords({ current_password: '', new_password: '', confirm_password: '' })
      setPwdMsg({ type: 'ok', text: t('profile.passwordUpdated') })
    },
    onError: (e: any) => {
      const text = e?.message === 'MISMATCH'
        ? t('profile.passwordMismatch')
        : translateError(e?.response?.data?.detail) || t('common.error')
      setPwdMsg({ type: 'err', text })
    },
  })

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Executive Profile Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#050607] via-[#0b1324] to-[#10203b] p-6 sm:p-8 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/30 to-brand-600/50 text-xl font-bold text-white ring-1 ring-white/20 shadow-inner">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{user?.name}</h1>
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-400/30">
                  {user?.status || 'active'}
                </span>
                {roleLabel && (
                  <span className="inline-flex items-center rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-medium text-sky-200 ring-1 ring-sky-400/30">
                    {roleLabel}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5"><Mail size={13} className="text-sky-400" /> {user?.email}</span>
                {currentOrg?.organization_name && (
                  <span className="inline-flex items-center gap-1.5"><Building2 size={13} className="text-sky-400" /> {currentOrg.organization_name}</span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleSignOut}
            className="border-white/15 bg-white/10 text-white hover:bg-red-500/20 hover:border-red-400/40 shrink-0"
          >
            <LogOut size={15} className="mr-2" />
            {t('common.signOut')}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck size={16} className="text-brand-600" />
              {t('profile.identity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profileMsg && (
              <div className={`rounded-lg p-3 text-sm ${profileMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {profileMsg.text}
              </div>
            )}
            <div>
              <label htmlFor="profile-name" className="block text-xs font-medium text-slate-600 mb-1.5">
                {t('profile.name')}
              </label>
              <Input id="profile-name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-xs font-medium text-slate-600 mb-1.5">
                {t('profile.email')}
              </label>
              <Input id="profile-email" value={user?.email || ''} disabled className="bg-slate-50 text-slate-500" />
            </div>
            <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending || name.trim().length < 2}>
              {updateProfile.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound size={16} className="text-brand-600" />
              {t('profile.security')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pwdMsg && (
              <div className={`rounded-lg p-3 text-sm ${pwdMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                {pwdMsg.text}
              </div>
            )}
            <div>
              <label htmlFor="cur-pwd" className="block text-xs font-medium text-slate-600 mb-1.5">
                {t('profile.currentPassword')}
              </label>
              <Input
                id="cur-pwd"
                type="password"
                value={passwords.current_password}
                onChange={e => setPasswords({ ...passwords, current_password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="new-pwd" className="block text-xs font-medium text-slate-600 mb-1.5">
                {t('profile.newPassword')}
              </label>
              <Input
                id="new-pwd"
                type="password"
                value={passwords.new_password}
                onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
              />
              {passwords.new_password && (
                <div className="mt-2 flex gap-1.5">
                  {[1, 2, 3, 4].map(n => (
                    <span
                      key={n}
                      className={`h-1 flex-1 rounded-full ${pwdStrength >= n ? (pwdStrength >= 3 ? 'bg-emerald-500' : 'bg-amber-500') : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="cnf-pwd" className="block text-xs font-medium text-slate-600 mb-1.5">
                {t('profile.confirmPassword')}
              </label>
              <Input
                id="cnf-pwd"
                type="password"
                value={passwords.confirm_password}
                onChange={e => setPasswords({ ...passwords, confirm_password: e.target.value })}
              />
            </div>
            <Button
              onClick={() => changePassword.mutate()}
              disabled={changePassword.isPending || !passwords.current_password || passwords.new_password.length < 8}
            >
              <Lock size={14} className="mr-2" />
              {changePassword.isPending ? t('common.loading') : t('profile.updatePassword')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand-600" />
            {t('profile.organizations')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {memberships.length === 0 && <div className="text-sm text-muted">{t('common.noOrganization')}</div>}
          {memberships.map(m => (
            <div key={m.organization_id} className="rounded-xl border border-border bg-slate-50/60 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 size={15} className="text-brand-600" />
                  {m.organization_name || m.organization_id}
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="open">{m.role}</Badge>
                  {m.organization_id === orgId && <Badge tone="ready">{t('profile.activeWorkspace')}</Badge>}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(m.permissions || []).map(perm => (
                  <span key={perm} className="rounded-md border border-border bg-white px-2 py-0.5 font-mono text-[11px] text-slate-600">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
