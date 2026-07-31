import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { search, suggestions } from '@/lib/search'
import { QuoteList, initials } from '@/components/QuoteCard'
import { EmptyState, PageHeader, Toast } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { useToast } from '@/hooks/useToast'
import { AUTHOR_BY_ID, ERAS, THEMES, THEME_BY_ID, authorQuoteCount } from '@/data'
import { resultCount } from '@/lib/text'
import { useStore } from '@/lib/store'
import { tap } from '@/lib/native'

const PROPOZYCJE = ['miłość', 'czas', 'odwaga', 'Seneka', 'wolność', 'Szekspir', 'szczęście', 'śmierć']

export default function SearchScreen() {
  const [q, setQ] = useState('')
  const [era, setEra] = useState<string | null>(null)
  const [theme, setTheme] = useState<string | null>(null)
  const deferred = useDeferredValue(q)
  const inputRef = useRef<HTMLInputElement>(null)
  const { message, show } = useToast()

  const searches = useStore((s) => s.searches)
  const rememberSearch = useStore((s) => s.rememberSearch)
  const forgetSearches = useStore((s) => s.forgetSearches)
  const hideDisputed = useStore((s) => s.settings.hideDisputed)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 260)
    return () => clearTimeout(t)
  }, [])

  const allHits = useMemo(() => search(deferred, 200), [deferred])
  const sugg = useMemo(() => suggestions(deferred), [deferred])
  const hasQuery = deferred.trim().length >= 2

  // Filtry zawężają wyniki, ale liczniki liczymy z pełnego zbioru,
  // żeby było widać, ile jest do odkrycia w każdej epoce i temacie.
  const hits = useMemo(
    () =>
      allHits
        .filter((h) => !era || AUTHOR_BY_ID[h.quote.authorId]?.era === era)
        .filter((h) => !theme || h.quote.themes.includes(theme))
        .filter((h) => !hideDisputed || !h.quote.disputed)
        .slice(0, 60),
    [allHits, era, theme, hideDisputed],
  )

  const erasPresent = useMemo(
    () =>
      ERAS.map((e) => ({
        ...e,
        n: allHits.filter((h) => AUTHOR_BY_ID[h.quote.authorId]?.era === e.id).length,
      })).filter((e) => e.n > 0),
    [allHits],
  )

  const themesPresent = useMemo(
    () =>
      THEMES.map((t) => ({ ...t, n: allHits.filter((h) => h.quote.themes.includes(t.id)).length }))
        .filter((t) => t.n > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 8),
    [allHits],
  )

  const commit = (value: string) => {
    setQ(value)
    setEra(null)
    setTheme(null)
    rememberSearch(value)
  }

  return (
    <div className="pb-8">
      <PageHeader
        title="Szukaj"
        subtitle="Po treści, autorze, temacie lub źródle. Polskie znaki nie mają znaczenia, a fraza w cudzysłowie szuka dosłownie."
      />

      <div className="sticky top-0 z-30 bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] px-5 py-2 backdrop-blur-xl md:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            rememberSearch(q)
            inputRef.current?.blur()
          }}
          className="glass-strong flex items-center gap-2.5 rounded-2xl px-4 py-3.5"
        >
          <Icon name="search" size={18} className="text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="np. „kto ma po co żyć” albo Marek Aureliusz"
            enterKeyHint="search"
            className="w-full text-[15px] outline-none placeholder:text-faint"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('')
                setEra(null)
                setTheme(null)
              }}
              aria-label="Wyczyść"
              className="press text-faint"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </form>
      </div>

      {!hasQuery && (
        <div className="mt-5 px-5 md:px-8">
          {searches.length > 0 && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
                  Ostatnio szukane
                </span>
                <button
                  onClick={() => {
                    tap()
                    forgetSearches()
                  }}
                  className="press focus-ring text-[11.5px] text-faint hover:text-ink"
                >
                  Wyczyść
                </button>
              </div>
              <div className="mb-7 flex flex-wrap gap-2">
                {searches.map((s) => (
                  <button
                    key={s}
                    onClick={() => commit(s)}
                    className="press focus-ring glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px]"
                  >
                    <Icon name="clock" size={12} className="text-faint" />
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
            Na dobry początek
          </div>
          <div className="flex flex-wrap gap-2">
            {PROPOZYCJE.map((p) => (
              <button
                key={p}
                onClick={() => commit(p)}
                className="press focus-ring rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted hover:text-ink"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="mt-7 mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
            Albo przez temat
          </div>
          <div className="flex flex-wrap gap-2">
            {THEMES.slice(0, 12).map((t) => (
              <Link
                key={t.id}
                to={`/temat/${t.id}`}
                className="press focus-ring rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted hover:text-ink"
              >
                {t.emoji} {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasQuery && (sugg.authors.length > 0 || sugg.themes.length > 0) && (
        <div className="mt-4 px-5 md:px-8">
          <div className="flex flex-wrap gap-2">
            {sugg.authors.map((a) => (
              <Link
                key={a.id}
                to={`/autor/${a.id}`}
                className="press focus-ring glass flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-[12.5px]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full border border-line text-[10px] font-semibold text-muted">
                  {initials(a.name)}
                </span>
                {a.name}
                <span className="text-faint tabular-nums">{authorQuoteCount(a.id)}</span>
              </Link>
            ))}
            {sugg.themes.map((t) => (
              <Link
                key={t.id}
                to={`/temat/${t.id}`}
                className="press focus-ring glass rounded-full px-3.5 py-2 text-[12.5px]"
              >
                {t.emoji} {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasQuery && allHits.length > 0 && (
        <div className="no-scrollbar mask-fade-r mt-4 flex gap-2 overflow-x-auto px-5 pb-1 md:px-8">
          {(era || theme) && (
            <FilterPill
              active
              onClick={() => {
                setEra(null)
                setTheme(null)
              }}
            >
              <Icon name="close" size={12} /> Wyczyść filtry
            </FilterPill>
          )}
          {erasPresent.map((e) => (
            <FilterPill
              key={e.id}
              active={era === e.id}
              onClick={() => setEra(era === e.id ? null : e.id)}
            >
              {e.name} <span className="tabular-nums opacity-60">{e.n}</span>
            </FilterPill>
          ))}
          {themesPresent.map((t) => (
            <FilterPill
              key={t.id}
              active={theme === t.id}
              onClick={() => setTheme(theme === t.id ? null : t.id)}
            >
              {t.emoji} {t.name} <span className="tabular-nums opacity-60">{t.n}</span>
            </FilterPill>
          ))}
        </div>
      )}

      {hasQuery && (
        <div className="mt-4">
          {hits.length > 0 ? (
            <>
              <div className="mb-3 px-5 text-[12px] text-faint md:px-8">
                {resultCount(hits.length)}
                {allHits.length > hits.length && ` z ${allHits.length}`}
                {theme && ` · ${THEME_BY_ID[theme]?.name}`}
              </div>
              <QuoteList quotes={hits.map((h) => h.quote)} query={deferred} onShared={show} />
            </>
          ) : (
            <EmptyState
              icon="search"
              title={allHits.length ? 'Filtry nic nie przepuszczają' : 'Nic nie pasuje'}
              text={
                allHits.length
                  ? 'Ta epoka lub temat nie mają wyników dla tego zapytania.'
                  : 'Spróbuj krótszej frazy albo poszukaj po nazwisku autora.'
              }
            />
          )}
        </div>
      )}

      <Toast message={message} />
    </div>
  )
}

function FilterPill({
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
      onClick={() => {
        tap()
        onClick()
      }}
      className={`press focus-ring inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] ${
        active
          ? 'border-transparent bg-[color-mix(in_oklab,var(--accent)_26%,transparent)] text-ink'
          : 'border-line text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
