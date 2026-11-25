import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function EvidencePage() {
  const qc = useQueryClient()
  const { t, tTerm, translateError } = useI18n()
  const { data: items = [] } = useQuery({ queryKey: ['evidence'], queryFn: async () => (await api.get('/evidence')).data })
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: async () => (await api.get('/incidents')).data })
  const [form, setForm] = useState({ title: '', type: 'report', source: '', description: '' })
  const [incidentId, setIncidentId] = useState('')
  const [correlations, setCorrelations] = useState<any>(null)
  const [error, setError] = useState('')

  const create = useMutation({
    mutationFn: async () => (await api.post('/evidence', form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['evidence'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
      setForm({ title: '', type: 'report', source: '', description: '' })
      setError('')
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail)),
  })

  const correlate = useMutation({
    mutationFn: async () => (await api.post('/evidence/correlate', { incident_id: incidentId })).data,
    onSuccess: (d) => {
      setCorrelations(d)
      setError('')
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail)),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t('evidence.title')}</h1>
        <p className="text-sm text-muted">{t('evidence.subtitle')}</p>
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">{error}</div>}
      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('evidence.add')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input aria-label={t('evidence.titleField')} placeholder={t('evidence.titleField')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select aria-label="Evidence type" className="rounded-md border border-border px-3 py-2 text-sm bg-white" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {['report', 'photo', 'document', 'testimony', 'log', 'other'].map(x => <option key={x} value={x}>{tTerm(x)}</option>)}
              </select>
              <Input aria-label={t('evidence.source')} placeholder={t('evidence.source')} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
            </div>
            <Textarea aria-label={t('evidence.description')} rows={4} placeholder={t('evidence.description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Button onClick={() => create.mutate()} disabled={!form.title || create.isPending}>{t('evidence.addBtn')}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('evidence.correlate')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select
              aria-label={t('filter.selectIncident')}
              className="w-full rounded-md border border-border px-3 py-2 text-sm bg-white"
              value={incidentId}
              onChange={e => setIncidentId(e.target.value)}
            >
              <option value="">{t('filter.selectIncident')}</option>
              {incidents.map((inc: any) => (
                <option key={inc.id} value={inc.id}>{inc.title} ({inc.severity} · {inc.status})</option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => correlate.mutate()} disabled={!incidentId || correlate.isPending}>
              {correlate.isPending ? t('evidence.finding') : t('evidence.find')}
            </Button>
            {correlations && (
              <div className="text-sm space-y-2">
                <div className="text-muted">{t('evidence.method')}: {correlations.method} · {correlations.suggestions?.length || 0} {t('evidence.suggestions')}</div>
                {(correlations.suggestions || []).map((s: any) => (
                  <div key={s.target_incident_id} className="border border-border rounded p-3 bg-slate-50">
                    <div className="font-medium">{s.target_title}</div>
                    <div className="text-xs text-muted">Score {s.score} · {s.verification_status}</div>
                    <div className="text-xs mt-1">{s.explanation}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('evidence.records')}</CardTitle></CardHeader>
        <CardContent className="divide-y divide-border">
          {items.length === 0 && <div className="text-sm text-muted py-4">{t('evidence.noItems')}</div>}
          {items.map((ev: any) => (
            <div key={ev.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{ev.title}</div>
                <div className="text-xs text-muted">{ev.source || t('evidence.noSource')} · <span className="font-mono">{ev.id}</span></div>
              </div>
              <Badge>{tTerm(ev.type)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
