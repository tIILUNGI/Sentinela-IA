import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

function cellTone(p: number, i: number): string {
  const product = p * i
  if (product >= 15) return 'bg-red-500/15 border-red-400/50 text-red-900 hover:bg-red-500/25'
  if (product >= 10) return 'bg-orange-500/15 border-orange-400/50 text-orange-900 hover:bg-orange-500/25'
  if (product >= 5) return 'bg-amber-500/15 border-amber-400/50 text-amber-900 hover:bg-amber-500/25'
  return 'bg-emerald-500/15 border-emerald-400/50 text-emerald-900 hover:bg-emerald-500/25'
}

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

  const countAt = (p: number, i: number) =>
    risks.filter((r: any) => Number(r.probability) === p && Number(r.impact) === i).length

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">{error}</div>}

      {/* Interactive 5x5 Risk Matrix */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle>5x5 Risk Matrix ({t('risks.probability')} x {t('risks.impact')})</CardTitle>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500" /> {tTerm('low')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500/40 border border-amber-500" /> {tTerm('moderate')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orange-500/40 border border-orange-500" /> {tTerm('high')}</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-500/40 border border-red-500" /> {tTerm('critical')}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[440px]">
              <div className="grid grid-cols-[64px_repeat(5,minmax(0,1fr))] gap-1.5 items-center">
                {[5, 4, 3, 2, 1].map(p => (
                  <div key={p} className="contents">
                    <div className="text-xs font-semibold text-slate-600 text-right pr-2">
                      P{p}
                    </div>
                    {[1, 2, 3, 4, 5].map(i => {
                      const count = countAt(p, i)
                      const selected = form.probability === p && form.impact === i
                      return (
                        <button
                          key={`${p}-${i}`}
                          type="button"
                          onClick={() => setForm({ ...form, probability: p, impact: i })}
                          aria-label={`Probability ${p}, Impact ${i}, ${count} assessments`}
                          className={`h-14 rounded-lg border text-xs font-semibold transition flex flex-col items-center justify-center ${cellTone(p, i)} ${selected ? 'ring-2 ring-brand-600 ring-offset-1' : ''}`}
                        >
                          <span className="text-sm font-bold">{count > 0 ? count : '·'}</span>
                          <span className="text-[10px] opacity-70">{p}x{i}={p * i}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
                <div />
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="text-center text-xs font-semibold text-slate-600 pt-1">
                    I{i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
