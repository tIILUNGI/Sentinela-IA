import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default function AuditPage() {
  const { t } = useI18n()
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit', actionFilter, resourceFilter],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (actionFilter.trim()) params.action = actionFilter.trim()
      if (resourceFilter.trim()) params.resource_type = resourceFilter.trim()
      return (await api.get('/audit', { params })).data
    },
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>{t('audit.logs')}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              aria-label={t('audit.action')}
              placeholder={t('audit.action')}
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="h-9 w-40 text-xs"
            />
            <Input
              aria-label={t('audit.resource')}
              placeholder={t('audit.resource')}
              value={resourceFilter}
              onChange={e => setResourceFilter(e.target.value)}
              className="h-9 w-40 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="text-sm text-muted">{t('common.loading')}</div> : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border text-slate-500">
                    <th className="py-2 pr-4">{t('audit.time')}</th>
                    <th className="py-2 pr-4">{t('audit.action')}</th>
                    <th className="py-2 pr-4">{t('audit.resource')}</th>
                    <th className="py-2 pr-4">{t('audit.resourceId')}</th>
                    <th className="py-2 pr-4">{t('audit.user')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 && <tr><td className="py-4 text-muted" colSpan={5}>{t('audit.noItems')}</td></tr>}
                  {logs.map((l: any) => (
                    <tr key={l.id} className="border-b border-border/60">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-xs text-slate-600">{formatDate(l.created_at)}</td>
                      <td className="py-2.5 pr-4"><Badge>{l.action}</Badge></td>
                      <td className="py-2.5 pr-4 text-slate-700">{l.resource_type}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{l.resource_id || '-'}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{l.user_id || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
