import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function RecommendationsPage() {
  const qc = useQueryClient()
  const { t, tTerm, translateError } = useI18n()
  const [statusFilter, setStatusFilter] = useState('')
  const { data: items = [] } = useQuery({
    queryKey: ['recommendations', statusFilter],
    queryFn: async () => (await api.get('/recommendations', { params: statusFilter ? { status: statusFilter } : undefined })).data,
  })
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', justification: '', limitations: '' })
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const create = useMutation({
    mutationFn: async () => (await api.post('/recommendations', form)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recommendations'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
      setForm({ title: '', description: '', priority: 'medium', justification: '', limitations: '' })
      setError('')
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail)),
  })

  const act = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      (await api.post(`/recommendations/${id}/${action}`, { review_notes: notes[id] || '' })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recommendations'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail)),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t('recommendations.title')}</h1>
        <p className="text-sm text-muted">{t('recommendations.subtitle')}</p>
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">{error}</div>}
      <div className="grid xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('recommendations.create')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input aria-label={t('recommendations.titleField')} placeholder={t('recommendations.titleField')} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea aria-label={t('recommendations.description')} rows={3} placeholder={t('recommendations.description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <select aria-label="Priority" className="w-full rounded-md border border-border px-3 py-2 text-sm bg-white" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p}>{tTerm(p)}</option>)}
            </select>
            <Textarea aria-label={t('recommendations.justification')} rows={2} placeholder={t('recommendations.justification')} value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} />
            <Textarea aria-label={t('recommendations.limitations')} rows={2} placeholder={t('recommendations.limitations')} value={form.limitations} onChange={e => setForm({ ...form, limitations: e.target.value })} />
            <Button onClick={() => create.mutate()} disabled={!form.title || !form.description || create.isPending}>{t('common.create')}</Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{t('recommendations.list')}</CardTitle>
            <select
              aria-label={t('filter.allStatuses')}
              className="h-9 rounded-md border border-border px-2.5 text-xs bg-white"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">{t('filter.allStatuses')}</option>
              {['pending', 'approved', 'rejected'].map(s => <option key={s} value={s}>{tTerm(s)}</option>)}
            </select>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && <div className="text-sm text-muted">{t('recommendations.noItems')}</div>}
            {items.map((r: any) => (
              <div key={r.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{r.title}</div>
                  <div className="flex gap-2">
                    <Badge tone={r.priority}>{tTerm(r.priority)}</Badge>
                    <Badge tone={r.status}>{tTerm(r.status)}</Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mt-2">{r.description}</p>
                {r.justification && <p className="text-xs text-slate-600 mt-2"><span className="font-medium">{t('recommendations.justification')}:</span> {r.justification}</p>}
                {r.limitations && <p className="text-xs text-slate-600 mt-1"><span className="font-medium">{t('recommendations.limitations')}:</span> {r.limitations}</p>}
                {r.review_notes && <p className="text-xs text-slate-600 mt-1"><span className="font-medium">{t('recommendations.reviewNotes')}:</span> {r.review_notes}</p>}
                {r.status === 'pending' && (
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <Input aria-label={t('recommendations.reviewNotes')} placeholder={t('recommendations.reviewNotes')} value={notes[r.id] || ''} onChange={e => setNotes({ ...notes, [r.id]: e.target.value })} />
                    <Button size="sm" onClick={() => act.mutate({ id: r.id, action: 'approve' })} disabled={act.isPending}>{t('common.approve')}</Button>
                    <Button size="sm" variant="danger" onClick={() => act.mutate({ id: r.id, action: 'reject' })} disabled={act.isPending}>{t('common.reject')}</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
