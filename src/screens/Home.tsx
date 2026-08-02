import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AUTHOR_BY_ID, ERAS, QUOTE_BY_ID, STATS, THEMES, themeQuoteCount } from '@/data'
import { formatPolishDate, quoteOfTheDay, randomQuote } from '@/lib/daily'
import { useStore } from '@/lib/store'
import { shareText, tap } from '@/lib/native'
import { Icon } from '@/components/Icon'
import { Chip, Section, StatPill, Toast } from '@/components/ui'
import { QuoteCard, initials, quoteAsText } from '@/components/QuoteCard'
import { useToast } from '@/hooks/useToast'

export default function Home() {
  const navigate = useNavigate()
  const { message, show } = useToast()
  const daily = useMemo(() => quoteOfTheDay(), [])
  const [spotlight, setSpotlight] = useState(() => randomQuote([daily.id]))
  const seen = useStore((s) => s.seen)
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const isFav = favorites.includes(daily.id)

  const author = AUTHOR_BY_ID[daily.authorId]
  const recent = seen.slice(0, 4).map((id) => QUOTE_BY_ID[id]).filter(Boolean)
  const featuredThemes = useMemo(
    () => [...THEMES].sort((a, b) => themeQuoteCount(b.id) - themeQuoteCount(a.id)).slice(0, 10),
    [],
  )

  return (
    <div className="pb-6">
      <header className="safe-top flex items-center justify-between px-5 pt-6 pb-2 md:px-8 md:pt-10">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
            {formatPolishDate()}
          </div>
          <h1 className="mt-1 text-[1.6rem] font-semibold tracking-[-0.02em] md:text-3xl">
            Cytat dnia
          </h1>
        </div>
        <Link
          to="/ustawienia"
          aria-label="Ustawienia"
          className="press focus-ring glass grid h-10 w-10 place-items-center rounded-full text-muted md:hidden"
        >
          <Icon name="settings" size={18} />
        </Link>
      </header>

      {/* ——— karta cytatu dnia ——— */}
      <section className="px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong relative overflow-hidden rounded-[1.9rem] p-6 shadow-[var(--shadow)] md:p-9"
        >
          <div
            className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-60 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent), transparent 65%)' }}
          />
          <Icon name="quote" size={30} className="mb-4 text-accent opacity-70" />

          <button
            onClick={() => navigate(`/cytat/${daily.id}`)}
            className="focus-ring block text-left"
          >
            <p className="quote-serif text-[1.5rem] leading-[1.35] tracking-[-0.015em] md:text-[2.1rem]">
              {daily.pl}
            </p>
          </button>

          {daily.original && (
            <p lang={daily.lang} className="mt-4 text-[13px] leading-relaxed text-faint italic">
              {daily.original}
            </p>
          )}

          <Link
            to={`/autor/${daily.authorId}`}
            className="focus-ring mt-6 flex items-center gap-3 text-left"
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-line-strong text-[12px] font-semibold text-muted">
              {initials(author?.name ?? '')}
            </span>
            <span>
              <span className="block text-[14.5px] font-medium">{author?.name}</span>
              <span className="block text-[12px] text-faint">
                {author?.role}
                {daily.disputed
                  ? ' · atrybucja sporna'
                  : daily.source
                    ? ` · ${daily.source}`
                    : ''}
              </span>
            </span>
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                tap()
                toggleFavorite(daily.id)
              }}
              className={`press focus-ring inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-[13px] ${
                isFav ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-line text-muted'
              }`}
            >
              <Icon name={isFav ? 'heart-fill' : 'heart'} size={16} />
              {isFav ? 'W ulubionych' : 'Zapisz'}
            </button>
            <button
              onClick={async () => {
                tap()
                const r = await shareText('Cytat dnia', quoteAsText(daily))
                if (r === 'copied') show('Skopiowano do schowka')
              }}
              className="press focus-ring inline-flex items-center gap-2 rounded-2xl border border-line px-3.5 py-2 text-[13px] text-muted"
            >
              <Icon name="share" size={16} />
              Udostępnij
            </button>
            <Link
              to={`/studio/${daily.id}`}
              className="press focus-ring inline-flex items-center gap-2 rounded-2xl border border-transparent bg-gradient-to-br from-violet-500 to-fuchsia-500 px-3.5 py-2 text-[13px] font-medium text-white"
            >
              <Icon name="image" size={16} />
              Zrób grafikę
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ——— statystyki ——— */}
      <div className="mt-5 grid grid-cols-2 gap-3 px-5 md:grid-cols-4 md:px-8">
        <StatPill value={STATS.quotes} label="cytatów" />
        <StatPill value={STATS.authors} label="autorów" />
        <StatPill value={STATS.themes} label="tematów" />
        <StatPill value={STATS.eras} label="epok" />
      </div>

      {/* ——— losowy strzał ——— */}
      <Section
        title="Rzut oka"
        icon="shuffle"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                tap()
                setSpotlight(randomQuote([daily.id, spotlight.id]))
              }}
              className="press focus-ring text-[12.5px] font-medium text-accent"
            >
              Losuj ponownie
            </button>
            <Link to="/losuj" className="focus-ring text-[12.5px] text-faint hover:text-ink">
              Więcej
            </Link>
          </div>
        }
      >
        <div className="px-5 md:px-8">
          <QuoteCard key={spotlight.id} quote={spotlight} onShared={show} />
        </div>
      </Section>

      {/* ——— tematy ——— */}
      <Section
        title="Tematy"
        icon="tag"
        action={
          <Link to="/odkrywaj" className="focus-ring text-[12.5px] font-medium text-accent">
            Wszystkie
          </Link>
        }
      >
        <div className="no-scrollbar mask-fade-r flex gap-2 overflow-x-auto px-5 pb-1 md:px-8">
          {featuredThemes.map((t) => (
            <Link key={t.id} to={`/temat/${t.id}`} className="focus-ring shrink-0">
              <Chip>
                <span>{t.emoji}</span>
                {t.name}
                <span className="text-faint tabular-nums">{themeQuoteCount(t.id)}</span>
              </Chip>
            </Link>
          ))}
        </div>
      </Section>

      {/* ——— epoki ——— */}
      <Section title="Epoki" icon="clock">
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2 md:grid md:grid-cols-3 md:overflow-visible md:px-8">
          {ERAS.map((e) => (
            <Link
              key={e.id}
              to={`/epoka/${e.id}`}
              className="press focus-ring glass relative w-[16rem] shrink-0 overflow-hidden rounded-3xl p-5 md:w-auto"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${e.gradient}`}
                aria-hidden
              />
              <div className="text-[15px] font-semibold">{e.name}</div>
              <div className="mt-0.5 text-[11.5px] uppercase tracking-[0.12em] text-faint">
                {e.range}
              </div>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-muted">{e.blurb}</p>
            </Link>
          ))}
        </div>
      </Section>

      {recent.length > 0 && (
        <Section title="Ostatnio oglądane" icon="clock">
          <div className="grid gap-3 px-5 md:grid-cols-2 md:px-8">
            {recent.map((q, i) => (
              <QuoteCard key={q.id} quote={q} variant="compact" index={i} onShared={show} />
            ))}
          </div>
        </Section>
      )}

      <Toast message={message} />
    </div>
  )
}
