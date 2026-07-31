import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { search, suggestions } from '@/lib/search'
import { QuoteList, initials } from '@/components/QuoteCard'
import { EmptyState, PageHeader, Toast } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { useToast } from '@/hooks/useToast'
import { THEMES, authorQuoteCount } from '@/data'
import { resultCount } from '@/lib/text'

const PROPOZYCJE = ['miłość', 'czas', 'odwaga', 'Seneka', 'wolność', 'Szekspir', 'szczęście', 'śmierć']

export default function SearchScreen() {
  const [q, setQ] = useState('')
  const deferred = useDeferredValue(q)
  const inputRef = useRef<HTMLInputElement>(null)
  const { message, show } = useToast()

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 260)
    return () => clearTimeout(t)
  }, [])

  const hits = useMemo(() => search(deferred), [deferred])
  const sugg = useMemo(() => suggestions(deferred), [deferred])
  const hasQuery = deferred.trim().length >= 2

  return (
    <div className="pb-8">
      <PageHeader title="Szukaj" subtitle="Po treści, autorze, temacie lub źródle. Polskie znaki nie mają znaczenia." />

      <div className="sticky top-0 z-30 bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] px-5 py-2 backdrop-blur-xl md:px-8">
        <label className="glass-strong flex items-center gap-2.5 rounded-2xl px-4 py-3.5">
          <Icon name="search" size={18} className="text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="np. „kto ma po co żyć” albo „Marek Aureliusz”"
            enterKeyHint="search"
            className="w-full text-[15px] outline-none placeholder:text-faint"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Wyczyść" className="press text-faint">
              <Icon name="close" size={16} />
            </button>
          )}
        </label>
      </div>

      {!hasQuery && (
        <div className="mt-5 px-5 md:px-8">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
            Na dobry początek
          </div>
          <div className="flex flex-wrap gap-2">
            {PROPOZYCJE.map((p) => (
              <button
                key={p}
                onClick={() => setQ(p)}
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

      {hasQuery && (
        <div className="mt-5">
          {hits.length > 0 ? (
            <>
              <div className="mb-3 px-5 text-[12px] text-faint md:px-8">
                {hits.length === 60 ? 'ponad 60 wyników' : resultCount(hits.length)}
              </div>
              <QuoteList quotes={hits.map((h) => h.quote)} query={deferred} onShared={show} />
            </>
          ) : (
            <EmptyState
              icon="search"
              title="Nic nie pasuje"
              text="Spróbuj krótszej frazy albo poszukaj po nazwisku autora."
            />
          )}
        </div>
      )}

      <Toast message={message} />
    </div>
  )
}
