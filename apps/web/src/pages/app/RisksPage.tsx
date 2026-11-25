import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function RisksPage() {
  const qc = useQueryClient()
  const { t, tTerm, translateError } = useI18n()
  const { data: risks = [] } = useQuery({ queryKey: ['risks'], queryFn: async () => (await api.get('/risks')).data })
  const { data: incidents = [] } = useQuery({ queryKey: ['incidents'], queryFn: async () => (await api.get('/incidents')).data })
  const [form, setForm] = useState({ incident_id: '', probability: 3, impact: 3, exposure: 3, urgency: 3, evidence_quality: 3, justification: '' })
  const [error, setError] = useState('')

  const assess = useMutation({
    mutationFn: async () => (await api.post('/risks/assess', { ...form, incident_id: form.incident_id || null })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risks'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
      setError('')
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail)),
  })

  const setNum = (k: string, v: string) => setForm({ ...form, [k]: Math.min(5, Math.max(1, Number(v) || 1)) })
  const factors = [
    ['probability', t('risks.probability')],
    ['impact', t('risks.impact')],
    ['exposure', t('risks.exposure')],
    ['urgency', t('risks.urgency')],
    ['evidence_quality', t('risks.evidenceQuality')],
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t('risks.title')}</h1>
        <p className="text-sm text-muted">{t('risks.subtitle')}</p>
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">{error}</div>}
      <div className="grid xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('risks.assess')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label htmlFor="risk-incident" className="block text-xs font-medium text-slate-600 mb-1">{t('risks.incidentOptional')}</label>
              <select
                id="risk-incident"
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-white"
                value={form.incident_id}
                onChange={e => setForm({ ...form, incident_id: e.target.value })}
              >
                <option value="">{t('common.none')}</option>
                {incidents.map((inc: any) => (
                  <option key={inc.id} value={inc.id}>{inc.title} ({inc.severity})</option>
                ))}
              </select>
            </div>
            {factors.map(([k, l]) => (
              <div key={k}>
                <label htmlFor={`risk-${k}`} className="text-sm text-slate-700 block mb-1">{l} ({t('risks.scale')})</label>
                <Input id={`risk-${k}`} type="number" min={1} max={5} value={(form as any)[k]} onChange={e => setNum(k, e.target.value)} />
              </div>
            ))}
            <Textarea aria-label={t('risks.justification')} rows={3} placeholder={t('risks.justification')} value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} />
            <Button onClick={() => assess.mutate()} disabled={assess.isPending}>{assess.isPending ? t('risks.calculating') : t('risks.calculate')}</Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>{t('risks.list')}</CardTitle></CardHeader>
          <CardContent className="divide-y divide-border">
            {risks.length === 0 && <div className="text-sm text-muted py-4">{t('risks.noItems')}</div>}
            {risks.map((r: any) => (
              <div key={r.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{t('risks.score')} {r.score} · {tTerm(r.level)}</div>
                  <Badge tone={r.level}>{tTerm(r.level)}</Badge>
                </div>
                <div className="text-xs text-muted mt-1">
                  P:{r.probability} I:{r.impact} E:{r.exposure} U:{r.urgency} Q:{r.evidence_quality} · {t('risks.humanReview')}: {r.requires_human_review ? t('common.yes') : t('common.no')}
                </div>
                {r.justification && <p className="text-sm text-slate-700 mt-2">{r.justification}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
