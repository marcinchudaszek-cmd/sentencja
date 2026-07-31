import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AUTHOR_BY_ID, ERAS, THEMES, THEME_BY_ID, quotesByTheme } from '@/data'
import { EmptyState, PageHeader, Toast } from '@/components/ui'
import { QuoteList } from '@/components/QuoteCard'
import { useToast } from '@/hooks/useToast'
import { useStore } from '@/lib/store'
import { quoteCount } from '@/lib/text'

export default function ThemeScreen() {
  const { id = '' } = useParams()
  const theme = THEME_BY_ID[id]
  const { message, show } = useToast()
  const [era, setEra] = useState<string | null>(null)
  const hideDisputed = useStore((s) => s.settings.hideDisputed)

  const quotes = useMemo(() => {
    if (!theme) return []
    return quotesByTheme(theme.id).filter(
      (q) =>
        (!era || AUTHOR_BY_ID[q.authorId]?.era === era) && (!hideDisputed || !q.disputed),
    )
  }, [theme, era, hideDisputed])

  if (!theme) {
    return (
      <div>
        <PageHeader title="Nieznany temat" back />
        <EmptyState icon="tag" title="Nie ma takiego tematu" />
      </div>
    )
  }

  const erasPresent = ERAS.filter((e) =>
    quotesByTheme(theme.id).some((q) => AUTHOR_BY_ID[q.authorId]?.era === e.id),
  )

  return (
    <div className="pb-8">
      <PageHeader
        back
        eyebrow="temat"
        title={
          <span className="flex items-center gap-3">
            <span>{theme.emoji}</span>
            {theme.name}
          </span>
        }
        subtitle={theme.blurb}
      />

      <div className={`mx-5 h-1 rounded-full bg-gradient-to-r md:mx-8 ${theme.gradient}`} />

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5 pb-1 md:px-8">
        <Pill active={!era} onClick={() => setEra(null)}>
          Wszystkie epoki · {quoteCount(quotesByTheme(theme.id).length)}
        </Pill>
        {erasPresent.map((e) => (
          <Pill key={e.id} active={era === e.id} onClick={() => setEra(era === e.id ? null : e.id)}>
            {e.name}
          </Pill>
        ))}
      </div>

      <div className="mt-4">
        {quotes.length ? (
          <QuoteList quotes={quotes} onShared={show} />
        ) : (
          <EmptyState icon="tag" title="Brak cytatów dla tego filtra" />
        )}
      </div>

      <section className="mt-8 px-5 md:px-8">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
          Pokrewne tematy
        </h2>
        <div className="flex flex-wrap gap-2">
          {THEMES.filter((t) => t.id !== theme.id)
            .slice(0, 12)
            .map((t) => (
              <Link
                key={t.id}
                to={`/temat/${t.id}`}
                className="press focus-ring rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted hover:text-ink"
              >
                {t.emoji} {t.name}
              </Link>
            ))}
        </div>
      </section>

      <Toast message={message} />
    </div>
  )
}

function Pill({
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
