import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default function IncidentsPage() {
  const qc = useQueryClient()
  const { t, tTerm, translateError } = useI18n()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')

  const { data: incidents = [], isLoading } = useQuery({
    queryKey: ['incidents', search, statusFilter, severityFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (search.trim()) params.q = search.trim()
      if (statusFilter) params.status = statusFilter
      if (severityFilter) params.severity = severityFilter
      return (await api.get('/incidents', { params })).data
    },
  })

  const [selected, setSelected] = useState<any>(null)
  const [form, setForm] = useState({ title: '', description: '', category: '', location: '', source: '', severity: 'medium', priority: 'medium' })
  const [error, setError] = useState('')
  const [analysisState, setAnalysis] = useState<any[]>([])

  const create = useMutation({
    mutationFn: async () => (await api.post('/incidents', form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
      setForm({ title: '', description: '', category: '', location: '', source: '', severity: 'medium', priority: 'medium' })
      setError('')
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail) || t('incidents.failedCreate')),
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      (await api.patch(`/incidents/${id}`, { status })).data,
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['incidents'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
      setSelected(updated)
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail) || t('common.error')),
  })

  const analyze = useMutation({
    mutationFn: async (id: string) => (await api.post(`/incidents/${id}/analyze`)).data,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['incident-analysis', selected?.id] })
      setAnalysis((prev: any) => [data, ...(prev || [])])
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail) || t('incidents.failedAnalysis')),
  })

  const { data: analysis = [] } = useQuery({
    queryKey: ['incident-analysis', selected?.id],
    queryFn: async () => (selected ? (await api.get(`/incidents/${selected.id}/analysis`)).data : []),
    enabled: !!selected,
  })
  const shownAnalysis = analysisState.length ? analysisState : analysis

  const selectIncident = (inc: any) => {
    setSelected(inc)
    setAnalysis([])
    setError('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t('incidents.title')}</h1>
        <p className="text-sm text-muted">{t('incidents.subtitle')}</p>
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">{error}</div>}

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
          <CardHeader><CardTitle>{t('incidents.create')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input aria-label={t('incidents.field.title')} placeholder={t('incidents.field.title')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea aria-label={t('incidents.field.description')} placeholder={t('incidents.field.description')} rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input aria-label={t('incidents.field.category')} placeholder={t('incidents.field.category')} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <Input aria-label={t('incidents.field.location')} placeholder={t('incidents.field.location')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              <Input aria-label={t('incidents.field.source')} placeholder={t('incidents.field.source')} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
              <select aria-label="Severity" className="rounded-md border border-border px-3 py-2 text-sm bg-white" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{tTerm(s)}</option>)}
              </select>
            </div>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.title || !form.description}>
              {create.isPending ? t('incidents.creating') : t('incidents.createBtn')}
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>{t('incidents.list')}</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <Input
                  aria-label={t('filter.search')}
                  placeholder={t('filter.search')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-9 w-44 text-xs"
                />
              </div>
              <select
                aria-label={t('filter.allStatuses')}
                className="h-9 rounded-md border border-border px-2.5 text-xs bg-white"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">{t('filter.allStatuses')}</option>
                {['open', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{tTerm(s)}</option>)}
              </select>
              <select
                aria-label={t('filter.allSeverities')}
                className="h-9 rounded-md border border-border px-2.5 text-xs bg-white"
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
              >
                <option value="">{t('filter.allSeverities')}</option>
                {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{tTerm(s)}</option>)}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="text-sm text-muted">{t('incidents.loading')}</div> : (
              <div className="divide-y divide-border">
                {incidents.length === 0 && <div className="text-sm text-muted py-4">{t('incidents.noItems')}</div>}
                {incidents.map((inc: any) => (
                  <button
                    key={inc.id}
                    onClick={() => selectIncident(inc)}
                    className={`w-full text-left py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-md ${selected?.id === inc.id ? 'bg-brand-100/40' : ''}`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{inc.title}</div>
                      <div className="text-xs text-muted">{inc.category || t('incidents.uncategorized')} · {formatDate(inc.created_at)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge tone={inc.severity}>{tTerm(inc.severity)}</Badge>
                      <Badge tone={inc.status}>{tTerm(inc.status)}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selected && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>{t('incidents.detail')}: {selected.title}</CardTitle>
              <div className="text-xs text-muted mt-1 font-mono">{selected.id}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Update incident status"
                className="h-9 rounded-md border border-border px-2.5 text-xs bg-white"
                value={selected.status}
                onChange={e => updateStatus.mutate({ id: selected.id, status: e.target.value })}
              >
                {['open', 'in_progress', 'resolved', 'closed'].map(s => <option key={s} value={s}>{tTerm(s)}</option>)}
              </select>
              <Button onClick={() => analyze.mutate(selected.id)} disabled={analyze.isPending}>
                {analyze.isPending ? t('incidents.analyzing') : t('incidents.runAnalysis')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone={selected.severity}>{tTerm(selected.severity)}</Badge>
              <Badge tone={selected.status}>{tTerm(selected.status)}</Badge>
              {selected.location && <Badge>{selected.location}</Badge>}
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900 mb-2">{t('incidents.analyses')}</h4>
              {shownAnalysis.length === 0 && <div className="text-sm text-muted">{t('incidents.noAnalysis')}</div>}
              <div className="space-y-3">
                {shownAnalysis.map((a: any) => (
                  <div key={a.id} className="border border-border rounded-lg p-4 bg-slate-50">
                    <div className="flex gap-2 mb-2">
                      <Badge tone={a.suggested_severity}>{a.suggested_severity || 'n/a'}</Badge>
                      <Badge>{a.status}</Badge>
                    </div>
                    {a.summary && <p className="text-sm text-slate-700"><span className="font-medium">{t('incidents.summary')}:</span> {a.summary}</p>}
                    {a.justification && <p className="text-sm text-slate-700 mt-2"><span className="font-medium">{t('incidents.justification')}:</span> {a.justification}</p>}
                    {Array.isArray(a.missing_information) && a.missing_information.length > 0 && (
                      <div className="text-sm mt-2"><span className="font-medium">{t('incidents.missingInfo')}:</span> {a.missing_information.join(', ')}</div>
                    )}
                    {Array.isArray(a.recommended_next_steps) && a.recommended_next_steps.length > 0 && (
                      <div className="text-sm mt-2">
                        <span className="font-medium">{t('incidents.nextSteps')}:</span>
                        <ul className="list-disc ml-5">{a.recommended_next_steps.map((s: string, i: number) => <li key={i}>{s}</li>)}</ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
