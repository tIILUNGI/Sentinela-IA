import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  default: 'bg-slate-100 text-slate-700',
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  moderate: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  ready: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  uploaded: 'bg-slate-100 text-slate-700',
}

export function Badge({ children, tone, className }: { children: React.ReactNode; tone?: string; className?: string }) {
  const key = (tone || String(children || '')).toLowerCase()
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', styles[key] || styles.default, className)}>{children}</span>
}
