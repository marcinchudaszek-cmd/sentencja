import { Link, useParams } from 'react-router-dom'
import { AUTHORS_WITH_QUOTES, ERA_BY_ID, authorQuoteCount, lifespan, quotesByEra } from '@/data'
import { EmptyState, PageHeader, Toast } from '@/components/ui'
import { QuoteList, initials } from '@/components/QuoteCard'
import { useToast } from '@/hooks/useToast'
import { quoteCount } from '@/lib/text'

export default function EraScreen() {
  const { id = '' } = useParams()
  const era = ERA_BY_ID[id]
  const { message, show } = useToast()

  if (!era) {
    return (
      <div>
        <PageHeader title="Nieznana epoka" back />
        <EmptyState icon="clock" title="Nie ma takiej epoki" />
      </div>
    )
  }

  const quotes = quotesByEra(era.id)
  const authors = AUTHORS_WITH_QUOTES.filter((a) => a.era === era.id).sort(
    (a, b) => (a.born ?? 0) - (b.born ?? 0),
  )

  return (
    <div className="pb-8">
      <PageHeader back eyebrow={era.range} title={era.name} subtitle={era.blurb} />

      <div className={`mx-5 h-1 rounded-full bg-gradient-to-r md:mx-8 ${era.gradient}`} />

      <section className="mt-5 px-5 md:px-8">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
          Autorzy epoki ({authors.length})
        </h2>
        <div className="no-scrollbar mask-fade-r flex gap-2 overflow-x-auto pb-1">
          {authors.map((a) => (
            <Link
              key={a.id}
              to={`/autor/${a.id}`}
              className="press focus-ring glass w-[13rem] shrink-0 rounded-2xl p-3.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-[11px] font-semibold text-muted">
                  {initials(a.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium">{a.name}</span>
                  <span className="block truncate text-[11px] text-faint">{lifespan(a)}</span>
                </span>
              </div>
              <div className="mt-2.5 text-[11px] text-faint">
                {a.role} · {quoteCount(authorQuoteCount(a.id))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <div className="mb-3 px-5 text-[12px] text-faint md:px-8">{quoteCount(quotes.length)}</div>
        <QuoteList quotes={quotes} onShared={show} />
      </div>

      <Toast message={message} />
    </div>
  )
}
