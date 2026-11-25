import { Link } from 'react-router-dom'
import {
  Shield, Radar, FileSearch, Network, Scale, Lightbulb, CheckSquare, ScrollText,
  ArrowRight, CheckCircle2, Lock, Building2, Globe2, ChevronDown, Sparkles,
  Database, GitBranch, Gauge, Layers, Fingerprint, FileText, BrainCircuit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Logo, LogoMark } from '@/components/brand/Logo'
import { useI18n } from '@/lib/i18n'

const moduleDefs = [
  { icon: Radar, key: 'command' },
  { icon: Shield, key: 'incident' },
  { icon: FileText, key: 'document' },
  { icon: Database, key: 'evidence' },
  { icon: Network, key: 'correlation' },
  { icon: Scale, key: 'risk' },
  { icon: Lightbulb, key: 'decision' },
  { icon: CheckSquare, key: 'resolution' },
  { icon: ScrollText, key: 'audit' },
  { icon: FileSearch, key: 'reports' },
]

export default function LandingPage() {
  const { t } = useI18n()
  const strip = [
    { icon: Radar, key: 'landing.hero.strip.incidents' },
    { icon: FileText, key: 'landing.hero.strip.documents' },
    { icon: Network, key: 'landing.hero.strip.evidence' },
    { icon: Scale, key: 'landing.hero.strip.risk' },
    { icon: Lightbulb, key: 'landing.hero.strip.recommendations' },
    { icon: ScrollText, key: 'landing.hero.strip.audit' },
  ]
  const intro = [
    { icon: Fingerprint, title: 'landing.intro.card1.title', desc: 'landing.intro.card1.desc' },
    { icon: Gauge, title: 'landing.intro.card2.title', desc: 'landing.intro.card2.desc' },
    { icon: Layers, title: 'landing.intro.card3.title', desc: 'landing.intro.card3.desc' },
  ]
  const steps = [
    { n: '01', title: 'landing.how.step1.title', desc: 'landing.how.step1.desc', icon: Database },
    { n: '02', title: 'landing.how.step2.title', desc: 'landing.how.step2.desc', icon: FileSearch },
    { n: '03', title: 'landing.how.step3.title', desc: 'landing.how.step3.desc', icon: BrainCircuit },
    { n: '04', title: 'landing.how.step4.title', desc: 'landing.how.step4.desc', icon: CheckSquare },
  ]
  const provide = [
    { icon: BrainCircuit, title: 'landing.provide.card1.title', desc: 'landing.provide.card1.desc', visual: 'kernel' },
    { icon: GitBranch, title: 'landing.provide.card2.title', desc: 'landing.provide.card2.desc', visual: 'graph' },
    { icon: Shield, title: 'landing.provide.card3.title', desc: 'landing.provide.card3.desc', visual: 'shield' },
  ]
  const security = [
    'landing.security.item1', 'landing.security.item2', 'landing.security.item3',
    'landing.security.item4', 'landing.security.item5',
  ]
  const faqs = [1, 2, 3, 4, 5]

  return (
    <div className="min-h-screen bg-[#050607] text-white selection:bg-white selection:text-black">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] bg-[#050607]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Logo markSize={34} size="sm" tagline />
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-sm text-slate-400">
            <a href="#platform" className="hover:text-white transition">{t('landing.header.nav.platform')}</a>
            <a href="#how" className="hover:text-white transition">{t('landing.header.nav.how')}</a>
            <a href="#security" className="hover:text-white transition">{t('landing.header.nav.security')}</a>
            <a href="#faq" className="hover:text-white transition">{t('landing.header.nav.faq')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher dark />
            <Link to="/login" className="hidden sm:block text-sm text-slate-300 hover:text-white">{t('landing.header.signIn')}</Link>
            <Link to="/app"><Button className="rounded-full bg-white text-black hover:bg-slate-200 px-4">{t('landing.header.enter')}</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-40 pb-24">
        <div className="absolute inset-x-0 top-0 h-[580px] pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,255,255,0.10), transparent 70%)' }} />
        <div className="absolute left-1/2 -translate-x-1/2 top-24 w-[520px] h-[520px] rounded-full border border-white/[0.04]" />
        <div className="absolute left-1/2 -translate-x-1/2 top-40 w-[320px] h-[320px] rounded-full border border-white/[0.05]" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-slate-400">
            <Sparkles size={12} /> {t('landing.hero.badge')}
          </div>
          <h1 className="mt-8 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-[-0.04em] leading-[1.02]">
            <span className="block text-white">{t('landing.hero.title1')}</span>
            <span className="block text-slate-500">{t('landing.hero.title2')}</span>
          </h1>
          <p className="mt-7 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">{t('landing.hero.subtitle')}</p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/app"><Button className="rounded-full bg-white text-black hover:bg-slate-200 px-6 py-3">{t('landing.hero.cta')} <ArrowRight size={16} className="ml-2" /></Button></Link>
            <a href="#how"><Button variant="secondary" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 px-6 py-3">{t('landing.hero.secondary')}</Button></a>
          </div>
          <div className="mt-5 text-xs text-slate-500">{t('landing.hero.note')}</div>

          {/* Emblem */}
          <div className="relative mt-16 flex justify-center">
            <div className="absolute top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
            <LogoMark size={164} animated className="relative drop-shadow-[0_0_60px_rgba(56,189,248,0.25)]" />
          </div>
        </div>

        {/* Capability strip */}
        <div className="relative max-w-7xl mx-auto px-6 mt-20">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-y border-white/[0.06] py-6 text-[13px] text-slate-400">
            {strip.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-center gap-2"><Icon size={14} className="text-slate-500" />{t(key)}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section id="platform" className="relative py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-500">{t('landing.intro.pill')}</div>
            <h2 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">{t('landing.intro.title')}</h2>
            <p className="mt-4 text-slate-400 leading-relaxed">{t('landing.intro.subtitle')}</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {intro.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-6">
                <div className="w-11 h-11 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center"><Icon size={20} className="text-slate-200" /></div>
                <h3 className="mt-5 font-semibold text-lg">{t(title)}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{t(desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-500">{t('landing.how.pill')}</div>
            <h2 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">{t('landing.how.title')}</h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">{t('landing.how.subtitle')}</p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {steps.map(({ n, title, desc, icon: Icon }) => (
              <div key={n} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 min-h-[250px] flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center"><Icon size={18} /></div>
                  <span className="text-xs tracking-widest text-slate-600">{n}</span>
                </div>
                <h3 className="mt-5 font-semibold">{t(title)}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{t(desc)}</p>
                <div className="mt-auto pt-5">
                  <div className="h-14 rounded-lg border border-white/[0.06] bg-black/40 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center"><Icon size={13} className="text-slate-500" /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we provide */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-500">{t('landing.provide.pill')}</div>
            <h2 className="mt-5 text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">{t('landing.provide.title')}</h2>
            <p className="mt-4 text-slate-400 max-w-2xl mx-auto">{t('landing.provide.subtitle')}</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {provide.map(({ icon: Icon, title, desc, visual }) => (
              <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <div className="h-44 relative bg-gradient-to-b from-white/[0.05] to-transparent flex items-center justify-center border-b border-white/[0.05]">
                  {visual === 'kernel' && <div className="relative"><div className="w-20 h-20 rounded-2xl border border-white/15 bg-white/[0.05] flex items-center justify-center"><BrainCircuit size={28} /></div><div className="absolute -top-3 -right-3 w-7 h-7 rounded-lg border border-white/10 bg-black flex items-center justify-center"><Database size={12} /></div></div>}
                  {visual === 'graph' && <div className="flex items-center gap-4 text-slate-500"><div className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center"><FileText size={17} /></div><div className="w-10 border-t border-dashed border-white/20" /><div className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center"><Network size={17} /></div><div className="w-10 border-t border-dashed border-white/20" /><div className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center"><Shield size={17} /></div></div>}
                  {visual === 'shield' && <div className="w-20 h-20 rounded-full border border-white/15 bg-white/[0.04] flex items-center justify-center"><Lock size={26} /></div>}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2"><Icon size={16} className="text-slate-400" /><h3 className="font-semibold">{t(title)}</h3></div>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{t(desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">{t('landing.modules.title')}</h2>
            <p className="mt-4 text-slate-400">{t('landing.modules.subtitle')}</p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {moduleDefs.map(({ icon: Icon, key }) => (
              <div key={key} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition">
                <Icon size={17} className="text-slate-400" />
                <div className="mt-3 text-sm font-medium">{t(`landing.modules.${key}`)}</div>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{t(`landing.modules.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="relative py-24 border-y border-white/[0.06] bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-4xl font-semibold tracking-[-0.03em]">{t('landing.sectors.title')}</h2>
              <p className="mt-4 text-slate-400">{t('landing.sectors.subtitle')}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {['public', 'private', 'corporate', 'institutions', 'multi'].map(s => (
                <div key={s} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-4 text-sm text-slate-300">
                  <Building2 size={15} className="text-slate-500" />{t(`landing.sectors.${s}`)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="relative py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-slate-500"><Lock size={12} /> Security</div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em]">{t('landing.security.title')}</h2>
            <p className="mt-4 text-slate-400">{t('landing.security.subtitle')}</p>
            <div className="mt-8 flex items-center gap-3 text-xs text-slate-500"><Globe2 size={14} /> EN / PT · Bilingual interface</div>
          </div>
          <div className="space-y-3">
            {security.map(item => (
              <div key={item} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <CheckCircle2 size={17} className="text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-300 leading-relaxed">{t(item)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-transparent p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-4xl font-semibold tracking-[-0.03em]">{t('landing.demo.title')}</h2>
                <p className="mt-4 text-slate-400">{t('landing.demo.subtitle')}</p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Link to="/app"><Button className="rounded-full bg-white text-black hover:bg-slate-200 px-6 py-3">{t('landing.demo.cta')} <ArrowRight size={16} className="ml-2" /></Button></Link>
                  <a href="#faq"><Button variant="secondary" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10 px-6 py-3">{t('landing.demo.secondary')}</Button></a>
                </div>
              </div>
              <div className="space-y-3">
                {['landing.demo.bullet1', 'landing.demo.bullet2', 'landing.demo.bullet3'].map(b => (
                  <div key={b} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/30 px-4 py-3 text-sm text-slate-300"><CheckCircle2 size={16} className="text-emerald-500" />{t(b)}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-24 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-semibold tracking-[-0.03em] text-center">{t('landing.faq.title')}</h2>
          <div className="mt-10 space-y-3">
            {faqs.map(n => (
              <details key={n} className="group rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-medium text-slate-200">
                  {t(`landing.faq.q${n}`)}
                  <ChevronDown size={16} className="text-slate-500 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">{t(`landing.faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">{t('landing.cta.title')}</h2>
          <p className="mt-4 text-slate-400">{t('landing.cta.subtitle')}</p>
          <div className="mt-8"><Link to="/register"><Button className="rounded-full bg-white text-black hover:bg-slate-200 px-6 py-3">{t('landing.cta.button')} <ArrowRight size={16} className="ml-2" /></Button></Link></div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-slate-500">
          <div>
            <Logo markSize={34} size="sm" tagline />
            <div className="mt-3">{t('landing.footer.tagline')}</div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher dark />
            <span>{t('landing.footer.rights')}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
