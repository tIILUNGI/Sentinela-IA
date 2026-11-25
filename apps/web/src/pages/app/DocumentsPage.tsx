import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default function DocumentsPage() {
  const qc = useQueryClient()
  const { t, tTerm, translateError } = useI18n()
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => (await api.get('/documents')).data,
    refetchInterval: (query) => {
      const list = (query.state.data as any[]) || []
      return list.some(d => d.status === 'uploaded' || d.status === 'processing') ? 3000 : false
    },
  })
  const [file, setFile] = useState<File | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [qa, setQa] = useState<any>(null)
  const [error, setError] = useState('')

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file')
      const fd = new FormData()
      fd.append('file', file)
      return (await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: (created) => {
      setFile(null)
      setError('')
      setSelected(created)
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['overview'] })
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail) || t('documents.failed')),
  })

  const analyze = useMutation({
    mutationFn: async (id: string) => (await api.post(`/documents/${id}/analyze`)).data,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      setSelected(d)
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail) || t('documents.failed')),
  })

  const ask = useMutation({
    mutationFn: async () => (await api.post(`/documents/${selected.id}/questions`, { question })).data,
    onSuccess: (d) => {
      setQa(d)
      setQuestion('')
      setError('')
    },
    onError: (e: any) => setError(translateError(e?.response?.data?.detail) || t('documents.failed')),
  })

  const liveSelected = selected ? docs.find((d: any) => d.id === selected.id) || selected : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t('documents.title')}</h1>
        <p className="text-sm text-muted">{t('documents.subtitle')}</p>
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">{error}</div>}
      <Card>
        <CardHeader><CardTitle>{t('documents.upload')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input aria-label={t('documents.upload')} type="file" accept=".pdf,.docx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} className="text-sm" />
          <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
            {upload.isPending ? t('documents.uploading') : t('documents.upload')}
          </Button>
          <div className="text-xs text-muted">{t('documents.supported')}</div>
        </CardContent>
      </Card>

      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('documents.list')}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="text-sm text-muted">{t('common.loading')}</div> : (
              <div className="divide-y divide-border">
                {docs.length === 0 && <div className="text-sm text-muted py-4">{t('documents.noItems')}</div>}
                {docs.map((d: any) => (
                  <button
                    key={d.id}
                    onClick={() => { setSelected(d); setQa(null); setError('') }}
                    className={`w-full text-left py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-md ${liveSelected?.id === d.id ? 'bg-brand-100/40' : ''}`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">{d.title}</div>
                      <div className="text-xs text-muted">{d.file_name} · {formatDate(d.created_at)}</div>
                    </div>
                    <Badge tone={d.status}>{tTerm(d.status)}</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('documents.detail')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!liveSelected && <div className="text-sm text-muted">{t('documents.select')}</div>}
            {liveSelected && (
              <>
                <div>
                  <div className="font-medium text-slate-900">{liveSelected.title}</div>
                  <div className="text-xs text-muted">{liveSelected.file_name} · {liveSelected.page_count ? t('documents.pages', { n: liveSelected.page_count }) : t('documents.pagesUnknown')}</div>
                  <div className="mt-2 flex gap-2">
                    <Badge tone={liveSelected.status}>{tTerm(liveSelected.status)}</Badge>
                    {liveSelected.file_hash && <Badge>SHA-256</Badge>}
                  </div>
                  {liveSelected.error_message && <div className="text-sm text-red-600 mt-2">{liveSelected.error_message}</div>}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => analyze.mutate(liveSelected.id)} disabled={analyze.isPending}>
                    {analyze.isPending ? t('documents.processing') : t('documents.reprocess')}
                  </Button>
                </div>
                <form
                  className="space-y-2"
                  onSubmit={e => {
                    e.preventDefault()
                    if (question.trim() && liveSelected.status === 'ready' && !ask.isPending) ask.mutate()
                  }}
                >
                  <label htmlFor="doc-question" className="text-sm font-medium block">{t('documents.ask')}</label>
                  <div className="flex gap-2">
                    <Input id="doc-question" value={question} onChange={e => setQuestion(e.target.value)} placeholder={t('documents.askPlaceholder')} />
                    <Button type="submit" disabled={!question.trim() || ask.isPending || liveSelected.status !== 'ready'}>
                      {ask.isPending ? t('documents.asking') : t('documents.ask')}
                    </Button>
                  </div>
                  {liveSelected.status !== 'ready' && <div className="text-xs text-muted">{t('documents.readyRequired')}</div>}
                </form>
                {qa && (
                  <div className="border border-border rounded-lg p-4 bg-slate-50 space-y-3">
                    <div>
                      <div className="text-xs font-semibold text-muted uppercase">{t('documents.answer')}</div>
                      <p className="text-sm text-slate-800 whitespace-pre-wrap mt-1">{qa.answer}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted uppercase mb-2">{t('documents.citations')}</div>
                      {Array.isArray(qa.citations) && qa.citations.length > 0 ? (
                        <div className="space-y-2">
                          {qa.citations.map((c: any, i: number) => (
                            <div key={i} className="text-xs bg-white border border-border rounded p-2">
                              <div className="font-medium">{t('documents.page')} {c.page_number ?? '-'} · {t('documents.chunk')} {c.chunk_index ?? '-'} {c.score != null ? `· ${t('documents.score')} ${Number(c.score).toFixed(3)}` : ''}</div>
                              <div className="text-slate-600 mt-1">{c.excerpt}</div>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-xs text-muted">{t('documents.noCitations')}</div>}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
