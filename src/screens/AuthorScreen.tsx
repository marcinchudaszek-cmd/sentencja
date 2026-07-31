import { Link, useParams } from 'react-router-dom'
import { AUTHOR_BY_ID, AUTHORS_WITH_QUOTES, ERA_BY_ID, lifespan, quotesByAuthor } from '@/data'
import { EmptyState, PageHeader, Toast } from '@/components/ui'
import { QuoteList, initials } from '@/components/QuoteCard'
import { Icon } from '@/components/Icon'
import { useToast } from '@/hooks/useToast'
import { quoteCount } from '@/lib/text'

export default function AuthorScreen() {
  const { id = '' } = useParams()
  const author = AUTHOR_BY_ID[id]
  const { message, show } = useToast()

  if (!author) {
    return (
      <div>
        <PageHeader title="Nieznany autor" back />
        <EmptyState icon="user" title="Nie ma takiego autora w bazie" />
      </div>
    )
  }

  const quotes = quotesByAuthor(author.id)
  const era = ERA_BY_ID[author.era]
  const kindred = AUTHORS_WITH_QUOTES.filter((a) => a.era === author.era && a.id !== author.id).slice(0, 8)

  return (
    <div className="pb-8">
      <PageHeader back eyebrow={era?.name} title={author.name} />

      <section className="px-5 md:px-8">
        <div className="glass overflow-hidden rounded-3xl p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-400/20 text-[17px] font-semibold">
              {initials(author.name)}
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-medium">{author.role}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-faint">
                <span className="inline-flex items-center gap-1">
                  <Icon name="globe" size={12} /> {author.country}
                </span>
                {lifespan(author) && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock" size={12} /> {lifespan(author)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{author.bio}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={`/epoka/${author.era}`}
              className="press focus-ring rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:text-ink"
            >
              {era?.name} · {era?.range}
            </Link>
            <span className="rounded-full border border-line px-3 py-1.5 text-[12px] text-muted">
              {quoteCount(quotes.length)}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-5">
        <QuoteList quotes={quotes} onShared={show} />
      </div>

      {kindred.length > 0 && (
        <section className="mt-8 px-5 md:px-8">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
            Z tej samej epoki
          </h2>
          <div className="no-scrollbar mask-fade-r flex gap-2 overflow-x-auto pb-1">
            {kindred.map((a) => (
              <Link
                key={a.id}
                to={`/autor/${a.id}`}
                className="press focus-ring glass flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-[12.5px]"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full border border-line text-[10px] font-semibold text-muted">
                  {initials(a.name)}
                </span>
                {a.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <Toast message={message} />
    </div>
  )
}
