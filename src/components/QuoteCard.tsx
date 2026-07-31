import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AUTHOR_BY_ID, THEME_BY_ID } from '@/data'
import type { Quote } from '@/data/types'
import { useStore } from '@/lib/store'
import { shareText, tap } from '@/lib/native'
import { Icon } from './Icon'
import { highlight } from '@/lib/search'

export function quoteAsText(q: Quote): string {
  const a = AUTHOR_BY_ID[q.authorId]
  return `„${q.pl}"\n— ${a?.name ?? ''}${q.source ? `, ${q.source}` : ''}`
}

interface Props {
  quote: Quote
  variant?: 'card' | 'compact'
  query?: string
  index?: number
  onShared?: (msg: string) => void
}

export function QuoteCard({ quote, variant = 'card', query, index = 0, onShared }: Props) {
  const navigate = useNavigate()
  const author = AUTHOR_BY_ID[quote.authorId]
  const fav = useStore((s) => s.favorites.includes(quote.id))
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const showOriginal = useStore((s) => s.settings.showOriginal)

  const body = query ? (
    <>
      {highlight(quote.pl, query).map((seg, i) =>
        seg.hit ? (
          <mark key={i} className="rounded bg-[color-mix(in_oklab,var(--accent)_35%,transparent)] px-0.5 text-ink">
            {seg.s}
          </mark>
        ) : (
          <span key={i}>{seg.s}</span>
        ),
      )}
    </>
  ) : (
    quote.pl
  )

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.25), ease: [0.16, 1, 0.3, 1] }}
      className="glass press group relative overflow-hidden rounded-[1.6rem] p-5 hover:border-line-strong"
    >
      <button
        onClick={() => navigate(`/cytat/${quote.id}`)}
        className="focus-ring block w-full text-left"
        aria-label="Otwórz cytat"
      >
        <p
          className={`quote-serif text-ink ${
            variant === 'compact' ? 'text-[1.05rem] leading-[1.5]' : 'text-[1.22rem] leading-[1.45] md:text-[1.35rem]'
          }`}
        >
          {body}
        </p>

        {showOriginal && quote.original && variant === 'card' && (
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-faint italic">{quote.original}</p>
        )}
      </button>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          to={`/autor/${quote.authorId}`}
          className="focus-ring group/a flex min-w-0 items-center gap-2.5"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-[11px] font-semibold text-muted">
            {initials(author?.name ?? '?')}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium group-hover/a:text-accent">
              {author?.name}
            </span>
            <span className="block truncate text-[11px] text-faint">
              {author?.role}
              {quote.disputed && ' · atrybucja sporna'}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => {
              tap()
              toggleFavorite(quote.id)
            }}
            aria-label={fav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
            className={`press focus-ring grid h-9 w-9 place-items-center rounded-full ${
              fav ? 'text-rose-400' : 'text-faint hover:text-ink'
            }`}
          >
            <Icon name={fav ? 'heart-fill' : 'heart'} size={17} />
          </button>
          <button
            onClick={async () => {
              tap()
              const r = await shareText('Cytat', quoteAsText(quote))
              if (r === 'copied') onShared?.('Skopiowano do schowka')
            }}
            aria-label="Udostępnij"
            className="press focus-ring grid h-9 w-9 place-items-center rounded-full text-faint hover:text-ink"
          >
            <Icon name="share" size={16} />
          </button>
        </div>
      </div>

      {variant === 'card' && quote.themes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quote.themes.map((t) => {
            const theme = THEME_BY_ID[t]
            if (!theme) return null
            return (
              <Link
                key={t}
                to={`/temat/${t}`}
                className="focus-ring rounded-full border border-line px-2.5 py-1 text-[11px] text-faint hover:text-ink"
              >
                {theme.emoji} {theme.name}
              </Link>
            )
          })}
        </div>
      )}
    </motion.article>
  )
}

export function initials(name: string): string {
  const parts = name.replace(/^(św\.|ks\.|Lord|Matka)\s+/i, '').split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export function QuoteList({
  quotes,
  query,
  variant = 'card',
  onShared,
}: {
  quotes: Quote[]
  query?: string
  variant?: 'card' | 'compact'
  onShared?: (m: string) => void
}) {
  return (
    <div className="grid gap-3 px-5 md:grid-cols-2 md:gap-4 md:px-8">
      {quotes.map((q, i) => (
        <QuoteCard key={q.id} quote={q} query={query} index={i} variant={variant} onShared={onShared} />
      ))}
    </div>
  )
}
