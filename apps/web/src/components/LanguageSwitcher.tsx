import { useI18n } from '@/lib/i18n'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  const { locale, setLocale } = useI18n()
  return (
    <div className={cn('inline-flex items-center gap-1 rounded-full border p-0.5 text-xs', dark ? 'border-white/15 bg-white/5 text-slate-300' : 'border-border bg-white text-slate-600')}>
      <Globe size={12} className="ml-2 opacity-70" />
      {(['en', 'pt'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={cn('rounded-full px-2.5 py-1 font-medium uppercase transition', locale === l ? (dark ? 'bg-white text-black' : 'bg-navy-900 text-white') : 'hover:opacity-80')}
        >
          {compact ? l : l === 'en' ? 'EN' : 'PT'}
        </button>
      ))}
    </div>
  )
}
