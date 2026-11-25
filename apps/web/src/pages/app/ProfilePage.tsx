import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ShieldCheck, KeyRound, Building2, LogOut, UserCheck } from 'lucide-react'
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
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t('profile.title')}</h1>
        <p className="text-sm text-muted">{t('profile.subtitle')}</p>
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
              <div className={`rounded-md p-3 text-sm ${profileMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {profileMsg.text}
              </div>
            )}
            <div>
              <label htmlFor="profile-name" className="block text-xs font-medium text-slate-600 mb-1">
                {t('profile.name')}
              </label>
              <Input id="profile-name" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-xs font-medium text-slate-600 mb-1">
                {t('profile.email')}
              </label>
              <Input id="profile-email" value={user?.email || ''} disabled className="bg-slate-50 text-slate-500" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <Badge tone={user?.status}>{user?.status || 'active'}</Badge>
              {user?.is_superuser && <Badge tone="open">{t('common.superAdmin')}</Badge>}
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
              <div className={`rounded-md p-3 text-sm ${pwdMsg.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {pwdMsg.text}
              </div>
            )}
            <div>
              <label htmlFor="cur-pwd" className="block text-xs font-medium text-slate-600 mb-1">
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
              <label htmlFor="new-pwd" className="block text-xs font-medium text-slate-600 mb-1">
                {t('profile.newPassword')}
              </label>
              <Input
                id="new-pwd"
                type="password"
                value={passwords.new_password}
                onChange={e => setPasswords({ ...passwords, new_password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="cnf-pwd" className="block text-xs font-medium text-slate-600 mb-1">
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
              {changePassword.isPending ? t('common.loading') : t('profile.updatePassword')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={16} className="text-brand-600" />
            {t('profile.organizations')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {memberships.length === 0 && <div className="text-sm text-muted">{t('common.noOrganization')}</div>}
          {memberships.map(m => (
            <div key={m.organization_id} className="rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900 flex items-center gap-2">
                  {m.organization_name || m.organization_id}
                  {m.organization_id === orgId && <Badge tone="ready">{t('profile.activeWorkspace')}</Badge>}
                </div>
                <div className="text-xs text-muted mt-1 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1"><ShieldCheck size={12} /> {m.role}</span>
                  <span>·</span>
                  <span>{(m.permissions || []).join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-semibold text-slate-900">{t('profile.sessionTitle')}</div>
            <div className="text-xs text-muted mt-0.5">{t('profile.sessionDesc')}</div>
          </div>
          <Button variant="danger" onClick={handleSignOut}>
            <LogOut size={15} className="mr-2" />
            {t('common.signOut')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
