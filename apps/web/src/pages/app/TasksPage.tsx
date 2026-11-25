import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function TasksPage() {
  const qc = useQueryClient()
  const { t, translateError } = useI18n()
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: async () => (await api.get('/tasks')).data })
  const [form, setForm] = useState({ title: '', description: '', status: 'open' })
  const [error, setError] = useState('')
  const create = useMutation({ mutationFn: async () => (await api.post('/tasks', form)).data, onSuccess: () => { qc.invalidateQueries({queryKey:['tasks']}); setForm({title:'',description:'',status:'open'}) }, onError: (e:any)=>setError(translateError(e?.response?.data?.detail)) })
  const update = useMutation({ mutationFn: async ({id,status}:{id:string;status:string}) => (await api.patch(`/tasks/${id}`, { status })).data, onSuccess: () => qc.invalidateQueries({queryKey:['tasks']}), onError: (e:any)=>setError(translateError(e?.response?.data?.detail)) })
  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md p-3">{error}</div>}
      <div className="grid xl:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>{t('tasks.create')}</CardTitle></CardHeader><CardContent className="space-y-3">
          <Input placeholder={t('tasks.titleField')} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
          <Textarea rows={4} placeholder={t('tasks.description')} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
          <Button onClick={()=>create.mutate()} disabled={!form.title || create.isPending}>{t('tasks.createBtn')}</Button>
        </CardContent></Card>
        <Card className="xl:col-span-2"><CardHeader><CardTitle>{t('tasks.list')}</CardTitle></CardHeader><CardContent className="divide-y divide-border">
          {tasks.length===0 && <div className="text-sm text-muted py-4">{t('tasks.noItems')}</div>}
          {tasks.map((task:any)=>(<div key={task.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="font-medium">{task.title}</div><div className="text-xs text-muted">{task.description || t('tasks.noDescription')}</div></div><div className="flex items-center gap-2"><Badge tone={task.status}>{task.status}</Badge><select className="text-sm border border-border rounded px-2 py-1" value={task.status} onChange={e=>update.mutate({id:task.id,status:e.target.value})}>{['open','in_progress','resolved','closed'].map(s=><option key={s}>{s}</option>)}</select></div></div>))}
        </CardContent></Card>
      </div>
    </div>
  )
}
