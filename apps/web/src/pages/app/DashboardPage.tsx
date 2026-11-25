import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import {
  AlertTriangle, FileText, ShieldAlert, CheckCircle2, Activity, Lightbulb, Scale, Shield, Download, ArrowUpRight,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const SEVERITY_COLORS: Record<string, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#ea580c',
  critical: '#dc2626',
  unknown: '#64748b',
}

const STATUS_COLORS: Record<string, string> = {
  open: '#1d63ed',
  in_progress: '#0ea5e9',
  pending: '#d97706',
  resolved: '#16a34a',
  closed: '#475569',
  unknown: '#94a3b8',
}

async function downloadCsv(path: string, filename: string) {
  const res = await api.get(path, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function DashboardPage() {
  const { user, memberships, orgId } = useAuth()
  const { t, tTerm } = useI18n()
  const currentOrg = memberships.find(m => m.organization_id === orgId)
  const roleLabel = user?.is_superuser ? t('common.superAdmin') : (currentOrg?.role || '')
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data,
  })

  if (isLoading) return <div className="text-slate-600">{t('dashboard.loading')}</div>
  if (error) return <div className="text-red-600">{t('dashboard.failed')}</div>
  const m = data?.metrics || {}

  const cards = [
    { label: t('dashboard.totalIncidents'), value: m.total_incidents ?? 0, icon: Activity },
    { label: t('dashboard.openIncidents'), value: m.open_incidents ?? 0, icon: AlertTriangle },
    { label: t('dashboard.criticalIncidents'), value: m.critical_incidents ?? 0, icon: ShieldAlert },
    { label: t('dashboard.resolvedIncidents'), value: m.resolved_incidents ?? 0, icon: CheckCircle2 },
    { label: t('dashboard.documentsReady'), value: m.documents_processed ?? 0, icon: FileText },
    { label: t('dashboard.evidenceItems'), value: m.evidence_items ?? 0, icon: Shield },
    { label: t('dashboard.avgRisk'), value: m.average_risk_score ?? 0, icon: Scale },
    { label: t('dashboard.pendingRecommendations'), value: m.pending_recommendations ?? 0, icon: Lightbulb },
  ]

  const severityData = (data?.incidents_by_severity || []).map((d: any) => ({
    ...d,
    label: tTerm(d.name),
  }))

  const statusData = (data?.incidents_by_status || []).map((d: any) => ({
    ...d,
    label: tTerm(d.name),
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{t('common.workspace')}</h1>
          <p className="text-sm text-muted">{currentOrg?.organization_name || t('common.noOrganization')} · {roleLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted mr-1">{t('dashboard.exports')}:</span>
          <Button size="sm" variant="secondary" onClick={() => downloadCsv('/reports/incidents.csv', 'incidents.csv')}>
            <Download size={14} className="mr-1.5" /> {t('dashboard.exportIncidents')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => downloadCsv('/reports/risks.csv', 'risks.csv')}>
            <Download size={14} className="mr-1.5" /> {t('dashboard.exportRisks')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => downloadCsv('/reports/recommendations.csv', 'recommendations.csv')}>
            <Download size={14} className="mr-1.5" /> {t('dashboard.exportRecommendations')}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <Card key={c.label}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-muted">{c.label}</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{c.value}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>{t('dashboard.trend')}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.incident_trend_7d || []}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d63ed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1d63ed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="incidents" stroke="#1d63ed" strokeWidth={2} fill="url(#trendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>{t('dashboard.bySeverity')}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={SEVERITY_COLORS[entry.name] || '#0b1b33'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>{t('dashboard.byStatus')}</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={52} outerRadius={82} paddingAngle={3}>
                  {statusData.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.recent')}</CardTitle>
          <Link to="/app/incidents" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
            {t('nav.incidents')} <ArrowUpRight size={13} />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {(data?.recent_activity || []).length === 0 && <div className="text-sm text-muted py-4">{t('dashboard.noRecent')}</div>}
            {(data?.recent_activity || []).map((i: any) => (
              <div key={i.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-slate-900">{i.title}</div>
                  <div className="text-xs text-muted">{new Date(i.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Badge tone={i.severity}>{tTerm(i.severity)}</Badge>
                  <Badge tone={i.status}>{tTerm(i.status)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
