import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  AUTHORS_WITH_QUOTES,
  ERAS,
  ERA_BY_ID,
  THEMES,
  authorQuoteCount,
  eraQuoteCount,
  lifespan,
  themeQuoteCount,
} from '@/data'
import { PageHeader } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { initials } from '@/components/QuoteCard'
import { normalize } from '@/lib/search'
import { quoteCount } from '@/lib/text'
import { LinkDoOsi } from './TimelineScreen'
import { tap } from '@/lib/native'

type Tab = 'tematy' | 'autorzy' | 'epoki'
type AuthorSort = 'alfabetycznie' | 'liczba' | 'chronologicznie'

export default function Explore() {
  const [tab, setTab] = useState<Tab>('tematy')

  return (
    <div>
      <PageHeader
        title="Odkrywaj"
        subtitle="Ta sama baza w trzech przekrojach: przez temat, przez człowieka i przez czas."
      />

      <div className="sticky top-0 z-30 -mt-1 bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] px-5 py-2 backdrop-blur-xl md:px-8">
        <div className="glass inline-flex rounded-2xl p-1">
          {(['tematy', 'autorzy', 'epoki'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                tap()
                setTab(t)
              }}
              className="press focus-ring relative rounded-xl px-4 py-1.5 text-[13px] capitalize"
            >
              {tab === t && (
                <motion.span
                  layoutId="explore-tab"
                  className="absolute inset-0 rounded-xl bg-[color-mix(in_oklab,var(--accent)_26%,transparent)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className={`relative ${tab === t ? 'text-ink' : 'text-muted'}`}>{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        {tab === 'tematy' && <Themes />}
        {tab === 'autorzy' && <Authors />}
        {tab === 'epoki' && <Eras />}
      </div>
    </div>
  )
}

function Themes() {
  const sorted = useMemo(
    () => [...THEMES].sort((a, b) => themeQuoteCount(b.id) - themeQuoteCount(a.id)),
    [],
  )
  return (
    <div className="grid grid-cols-2 gap-3 px-5 md:grid-cols-3 md:px-8">
      {sorted.map((t, i) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: Math.min(i * 0.02, 0.3) }}
        >
          <Link
            to={`/temat/${t.id}`}
            className="press focus-ring glass relative flex h-full flex-col overflow-hidden rounded-3xl p-4 hover:border-line-strong"
          >
            <div
              className={`pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-25 blur-2xl ${t.gradient}`}
            />
            <div className="text-2xl">{t.emoji}</div>
            <div className="mt-2 text-[14.5px] font-medium">{t.name}</div>
            <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-faint">{t.blurb}</p>
            <div className="mt-3 text-[11px] tabular-nums text-muted">
              {quoteCount(themeQuoteCount(t.id))}
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

function Authors() {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<AuthorSort>('liczba')
  const [era, setEra] = useState<string | null>(null)

  const list = useMemo(() => {
    const nq = normalize(q)
    let out = AUTHORS_WITH_QUOTES.filter(
      (a) =>
        (!era || a.era === era) &&
        (!nq || normalize(`${a.name} ${a.role} ${a.country}`).includes(nq)),
    )
    out = [...out].sort((a, b) => {
      if (sort === 'liczba') return authorQuoteCount(b.id) - authorQuoteCount(a.id)
      if (sort === 'chronologicznie') return (a.born ?? 0) - (b.born ?? 0)
      return a.name.localeCompare(b.name, 'pl')
    })
    return out
  }, [q, sort, era])

  return (
    <div>
      <div className="px-5 md:px-8">
        <label className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3">
          <Icon name="search" size={17} className="text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Szukaj autora…"
            className="w-full text-[14px] outline-none placeholder:text-faint"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Wyczyść" className="text-faint">
              <Icon name="close" size={15} />
            </button>
          )}
        </label>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-1 md:px-8">
        <FilterChip active={!era} onClick={() => setEra(null)}>
          Wszystkie epoki
        </FilterChip>
        {ERAS.map((e) => (
          <FilterChip key={e.id} active={era === e.id} onClick={() => setEra(era === e.id ? null : e.id)}>
            {e.name}
          </FilterChip>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2 px-5 text-[11.5px] text-faint md:px-8">
        <Icon name="filter" size={13} />
        <span>Sortuj:</span>
        {(['liczba', 'alfabetycznie', 'chronologicznie'] as AuthorSort[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`focus-ring rounded-full px-2 py-0.5 ${sort === s ? 'text-accent' : 'hover:text-ink'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-2.5 px-5 md:grid-cols-2 md:px-8">
        {list.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: Math.min(i * 0.012, 0.25) }}
          >
            <Link
              to={`/autor/${a.id}`}
              className="press focus-ring glass flex items-center gap-3.5 rounded-2xl p-3.5 hover:border-line-strong"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-[12px] font-semibold text-muted">
                {initials(a.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{a.name}</span>
                <span className="block truncate text-[11.5px] text-faint">
                  {a.role} · {lifespan(a) || ERA_BY_ID[a.era].name}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] tabular-nums text-muted">
                {authorQuoteCount(a.id)}
              </span>
            </Link>
          </motion.div>
        ))}
        {list.length === 0 && (
          <p className="col-span-full py-10 text-center text-[13px] text-faint">
            Nikt taki nie znalazł się jeszcze w tej bibliotece.
          </p>
        )}
      </div>
    </div>
  )
}

function Eras() {
  return (
    <div className="grid gap-3 px-5 md:grid-cols-2 md:px-8">
      <div className="md:col-span-2">
        <LinkDoOsi />
      </div>
      {ERAS.map((e, i) => (
        <motion.div
          key={e.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: i * 0.03 }}
        >
          <Link
            to={`/epoka/${e.id}`}
            className="press focus-ring glass relative block overflow-hidden rounded-3xl p-5 hover:border-line-strong"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${e.gradient}`} />
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[16px] font-semibold">{e.name}</h3>
              <span className="text-[11px] tabular-nums text-faint">{quoteCount(eraQuoteCount(e.id))}</span>
            </div>
            <div className="mt-0.5 text-[11.5px] uppercase tracking-[0.12em] text-faint">{e.range}</div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{e.blurb}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`press focus-ring shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] ${
        active
          ? 'border-transparent bg-[color-mix(in_oklab,var(--accent)_26%,transparent)] text-ink'
          : 'border-line text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
