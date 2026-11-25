import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, FileText, Shield, Scale, Lightbulb,
  CheckSquare, ScrollText, LogOut, Building2, UserCircle, Menu, X, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Logo } from '@/components/brand/Logo'

export function AppLayout() {
  const { user, memberships, orgId, setOrgId, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const currentOrg = memberships.find(m => m.organization_id === orgId)
  const roleLabel = user?.is_superuser ? t('common.superAdmin') : (currentOrg?.role || '')

  const initials = (user?.name || user?.email || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('')

  const nav = [
    { to: '/app', label: t('nav.commandCenter'), subtitle: t('dashboard.subtitle'), icon: LayoutDashboard, end: true },
    { to: '/app/incidents', label: t('nav.incidents'), subtitle: t('incidents.subtitle'), icon: AlertTriangle },
    { to: '/app/documents', label: t('nav.documents'), subtitle: t('documents.subtitle'), icon: FileText },
    { to: '/app/evidence', label: t('nav.evidence'), subtitle: t('evidence.subtitle'), icon: Shield },
    { to: '/app/risks', label: t('nav.risks'), subtitle: t('risks.subtitle'), icon: Scale },
    { to: '/app/recommendations', label: t('nav.recommendations'), subtitle: t('recommendations.subtitle'), icon: Lightbulb },
    { to: '/app/tasks', label: t('nav.tasks'), subtitle: t('tasks.subtitle'), icon: CheckSquare },
    { to: '/app/audit', label: t('nav.audit'), subtitle: t('audit.subtitle'), icon: ScrollText },
  ]

  const activeNav = nav.find(n => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))
  const headerTitle = location.pathname.startsWith('/app/profile')
    ? t('profile.title')
    : (activeNav?.label || t('nav.commandCenter'))
  const headerSubtitle = location.pathname.startsWith('/app/profile')
    ? t('profile.subtitle')
    : (activeNav?.subtitle || `${currentOrg?.organization_name || t('common.noOrganization')} · ${roleLabel}`)

  const handleSignOut = async () => {
    await logout()
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#050607] text-white">
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.08]">
        <Link to="/app" onClick={() => setMobileOpen(false)} aria-label="SENTINELA AI">
          <Logo markSize={30} size="sm" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Close navigation menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto p-3 space-y-1">
        {nav.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                  isActive
                    ? 'bg-gradient-to-r from-brand-600/25 via-sky-500/15 to-transparent text-white ring-1 ring-sky-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <Icon size={16} className={isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    {item.label}
                  </span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.08] space-y-2">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-slate-400">
            <Building2 size={13} className="shrink-0 text-sky-400" />
            <span className="truncate font-medium text-slate-200">{currentOrg?.organization_name || t('common.organization')}</span>
          </div>
          {roleLabel && <div className="mt-1 pl-5 text-[11px] text-slate-500">{roleLabel}</div>}
        </div>

        <NavLink
          to="/app/profile"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-xs transition',
              isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/[0.05] hover:text-white',
            )
          }
        >
          <span className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/30 to-brand-600/40 text-[11px] font-semibold text-sky-200 ring-1 ring-white/15">
              {initials}
            </span>
            <span className="truncate">
              <span className="block truncate font-medium text-slate-100">{user?.name}</span>
              <span className="block truncate text-[11px] text-slate-500">{t('nav.profile')}</span>
            </span>
          </span>
          <ChevronRight size={14} className="shrink-0 text-slate-500" />
        </NavLink>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={14} />
          {t('common.signOut')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface flex">
      <a
        href="#main-content"
        className="sr-only-focusable fixed left-4 top-4 z-50 rounded-lg bg-obsidian-950 px-4 py-2 text-xs font-medium text-white shadow-lg"
      >
        Skip to content
      </a>

      {/* Static Desktop Sidebar */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen w-64 shrink-0 flex-col border-r border-white/[0.08]">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside id="mobile-sidebar" className="relative z-10 w-72 max-w-[85vw] h-full border-r border-white/10">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-border flex items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-sidebar"
              aria-label="Open navigation menu"
              className="lg:hidden rounded-lg border border-border p-2 text-slate-700 hover:bg-slate-100"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{headerTitle}</div>
              <div className="text-xs text-muted truncate">{headerSubtitle}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher />
            {memberships.length > 1 && (
              <select
                aria-label={t('common.organization')}
                value={orgId || ''}
                onChange={e => setOrgId(e.target.value)}
                className="text-xs sm:text-sm border border-border rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
              >
                {memberships.map(m => (
                  <option key={m.organization_id} value={m.organization_id}>
                    {m.organization_name || m.organization_id}
                  </option>
                ))}
              </select>
            )}
            <Link
              to="/app/profile"
              className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              <UserCircle size={15} className="text-brand-600" />
              <span className="max-w-[160px] truncate">{user?.email}</span>
            </Link>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
