import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  AUTHOR_BY_ID,
  ERA_BY_ID,
  QUOTE_BY_ID,
  THEME_BY_ID,
  lifespan,
  quotesByAuthor,
  quotesByTheme,
} from '@/data'
import { useStore } from '@/lib/store'
import { shareText, tap } from '@/lib/native'
import { EmptyState, PageHeader, Toast } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { QuoteCard, initials, quoteAsText } from '@/components/QuoteCard'
import { useToast } from '@/hooks/useToast'

export default function QuoteScreen() {
  const { id = '' } = useParams()
  const quote = QUOTE_BY_ID[id]
  const { message, show } = useToast()

  const markSeen = useStore((s) => s.markSeen)
  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const notes = useStore((s) => s.notes)
  const setNote = useStore((s) => s.setNote)
  const collections = useStore((s) => s.collections)
  const toggleInCollection = useStore((s) => s.toggleInCollection)
  const createCollection = useStore((s) => s.createCollection)

  const [noteDraft, setNoteDraft] = useState('')
  const [editingNote, setEditingNote] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (quote) markSeen(quote.id)
  }, [quote, markSeen])

  useEffect(() => {
    setNoteDraft(notes[id] ?? '')
  }, [id, notes])

  const related = useMemo(() => {
    if (!quote) return []
    const sameAuthor = quotesByAuthor(quote.authorId).filter((q) => q.id !== quote.id).slice(0, 2)
    const sameTheme = quote.themes
      .flatMap((t) => quotesByTheme(t))
      .filter((q) => q.id !== quote.id && !sameAuthor.some((s) => s.id === q.id))
    const seen = new Set<string>()
    const unique = sameTheme.filter((q) => (seen.has(q.id) ? false : (seen.add(q.id), true)))
    return [...sameAuthor, ...unique.slice(0, 4)]
  }, [quote])

  if (!quote) {
    return (
      <div>
        <PageHeader title="Nie znaleziono" back />
        <EmptyState icon="quote" title="Ten cytat nie istnieje" />
      </div>
    )
  }

  const author = AUTHOR_BY_ID[quote.authorId]
  const era = ERA_BY_ID[author?.era ?? '']
  const isFav = favorites.includes(quote.id)
  const inCollections = collections.filter((c) => c.quoteIds.includes(quote.id))

  return (
    <div className="pb-10">
      <PageHeader back eyebrow={era?.name} title={author?.name ?? 'Cytat'} />

      <section className="px-5 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong relative overflow-hidden rounded-[1.9rem] p-6 shadow-[var(--shadow)] md:p-9"
        >
          <div
            className="pointer-events-none absolute -top-20 -left-10 h-56 w-56 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--accent), transparent 65%)' }}
          />
          <Icon name="quote" size={28} className="mb-4 text-accent opacity-70" />
          <p className="quote-serif text-[1.45rem] leading-[1.38] tracking-[-0.015em] md:text-[2rem]">
            {quote.pl}
          </p>

          {quote.original && (
            <div className="mt-5 rounded-2xl border border-line p-4">
              <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.16em] text-faint">
                oryginał{quote.lang ? ` · ${LANG_NAMES[quote.lang] ?? quote.lang}` : ''}
              </div>
              {/* lang pozwala czytnikowi ekranu przeczytać łacinę czy grekę
                  właściwą wymową zamiast po polsku */}
              <p lang={quote.lang} className="text-[14px] leading-relaxed text-muted italic">
                {quote.original}
              </p>
            </div>
          )}

          {quote.source && (
            <div className="mt-4 flex items-start gap-2 text-[12.5px] text-faint">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              <span>{quote.source}</span>
            </div>
          )}

          {quote.disputed && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-[12px] leading-relaxed text-amber-200/90">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              <span>
                Atrybucja sporna — cytat jest powszechnie przypisywany temu autorowi, ale nie
                potwierdzają go zachowane źródła.
              </span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {quote.themes.map((t) => {
              const th = THEME_BY_ID[t]
              return th ? (
                <Link
                  key={t}
                  to={`/temat/${t}`}
                  className="press focus-ring rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:text-ink"
                >
                  {th.emoji} {th.name}
                </Link>
              ) : null
            })}
          </div>
        </motion.div>
      </section>

      {/* ——— akcje ——— */}
      <div className="mt-4 grid grid-cols-4 gap-2 px-5 md:px-8">
        <ActionButton
          icon={isFav ? 'heart-fill' : 'heart'}
          label={isFav ? 'Zapisany' : 'Ulubione'}
          active={isFav}
          onClick={() => {
            tap()
            toggleFavorite(quote.id)
          }}
        />
        <ActionButton
          icon="folder"
          label="Kolekcja"
          active={inCollections.length > 0}
          onClick={() => {
            tap()
            setPickerOpen(true)
          }}
        />
        <ActionButton
          icon="share"
          label="Udostępnij"
          onClick={async () => {
            tap()
            const r = await shareText('Cytat', quoteAsText(quote))
            if (r === 'copied') show('Skopiowano do schowka')
          }}
        />
        <Link to={`/studio/${quote.id}`} className="focus-ring">
          <div className="press glass flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl py-3 text-accent">
            <Icon name="image" size={19} />
            <span className="text-[11px] text-muted">Grafika</span>
          </div>
        </Link>
      </div>

      {/* ——— notatka ——— */}
      <section className="mt-5 px-5 md:px-8">
        {editingNote ? (
          <div className="glass rounded-2xl p-4">
            <textarea
              autoFocus
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              placeholder="Dlaczego chcesz zapamiętać ten cytat?"
              className="w-full resize-none text-[14px] leading-relaxed outline-none placeholder:text-faint"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setNote(quote.id, noteDraft)
                  setEditingNote(false)
                  show(noteDraft.trim() ? 'Notatka zapisana' : 'Notatka usunięta')
                }}
                className="press focus-ring rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-4 py-2 text-[13px] font-medium text-white"
              >
                Zapisz
              </button>
              <button
                onClick={() => {
                  setNoteDraft(notes[quote.id] ?? '')
                  setEditingNote(false)
                }}
                className="press focus-ring rounded-xl border border-line px-4 py-2 text-[13px] text-muted"
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingNote(true)}
            className="press focus-ring glass flex w-full items-start gap-3 rounded-2xl p-4 text-left"
          >
            <Icon name="note" size={16} className="mt-0.5 shrink-0 text-accent" />
            <span className="flex-1 text-[13.5px] leading-relaxed">
              {notes[quote.id] || <span className="text-faint">Dodaj własną notatkę…</span>}
            </span>
            <Icon name="pencil" size={14} className="mt-0.5 shrink-0 text-faint" />
          </button>
        )}
      </section>

      {inCollections.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 px-5 md:px-8">
          {inCollections.map((c) => (
            <Link
              key={c.id}
              to={`/zbiory/${c.id}`}
              className="press focus-ring rounded-full border border-line px-3 py-1.5 text-[12px] text-muted hover:text-ink"
            >
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* ——— autor ——— */}
      {author && (
        <section className="mt-6 px-5 md:px-8">
          <Link to={`/autor/${author.id}`} className="press focus-ring glass block rounded-3xl p-5">
            <div className="flex items-center gap-3.5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-400/20 text-[15px] font-semibold">
                {initials(author.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-medium">{author.name}</div>
                <div className="text-[12px] text-faint">
                  {author.role} · {lifespan(author) || era?.name}
                </div>
              </div>
              <Icon name="chevron" size={16} className="text-faint" />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{author.bio}</p>
          </Link>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 px-5 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted md:px-8">
            W podobnym tonie
          </h2>
          <div className="grid gap-3 px-5 md:grid-cols-2 md:px-8">
            {related.map((q, i) => (
              <QuoteCard key={q.id} quote={q} variant="compact" index={i} onShared={show} />
            ))}
          </div>
        </section>
      )}

      {pickerOpen && (
        <CollectionPicker
          quoteId={quote.id}
          onClose={() => setPickerOpen(false)}
          collections={collections}
          onToggle={(cid) => toggleInCollection(cid, quote.id)}
          onCreate={(name) => {
            const cid = createCollection(name)
            toggleInCollection(cid, quote.id)
            show('Dodano do nowej kolekcji')
          }}
        />
      )}

      <Toast message={message} />
    </div>
  )
}

const LANG_NAMES: Record<string, string> = {
  la: 'łacina',
  grc: 'greka',
  en: 'angielski',
  de: 'niemiecki',
  fr: 'francuski',
  it: 'włoski',
  es: 'hiszpański',
  ru: 'rosyjski',
  pl: 'polski',
  ar: 'arabski',
  fa: 'perski',
  zh: 'chiński',
  sa: 'sanskryt',
  pt: 'portugalski',
}

function ActionButton({
  icon,
  label,
  onClick,
  active,
}: {
  icon: Parameters<typeof Icon>[0]['name']
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`press focus-ring glass flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 ${
        active ? 'text-rose-400' : 'text-muted'
      }`}
    >
      <Icon name={icon} size={19} />
      <span className="text-[11px] text-muted">{label}</span>
    </button>
  )
}

function CollectionPicker({
  quoteId,
  collections,
  onToggle,
  onCreate,
  onClose,
}: {
  quoteId: string
  collections: { id: string; name: string; emoji: string; quoteIds: string[] }[]
  onToggle: (id: string) => void
  onCreate: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const panel = useRef<HTMLDivElement>(null)

  // Escape zamyka, a fokus wchodzi do okna — inaczej czytnik ekranu i
  // klawiatura zostają w treści pod spodem.
  useEffect(() => {
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        aria-label="Zamknij"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
      />
      <motion.div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tytul-kolekcji"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        className="glass-strong relative w-full max-w-md rounded-t-[1.8rem] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] outline-none md:rounded-[1.8rem]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border-strong)] md:hidden" />
        <h2 id="tytul-kolekcji" className="mb-3 text-[15px] font-medium">
          Dodaj do kolekcji
        </h2>

        <div className="max-h-[45dvh] space-y-1.5 overflow-y-auto">
          {collections.map((c) => {
            const inside = c.quoteIds.includes(quoteId)
            return (
              <button
                key={c.id}
                onClick={() => {
                  tap()
                  onToggle(c.id)
                }}
                className={`press focus-ring flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${
                  inside ? 'border-accent/50 bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]' : 'border-line'
                }`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-line">
                  {c.emoji}
                </span>
                <span className="flex-1 text-[13.5px]">{c.name}</span>
                {inside && <Icon name="check" size={16} className="text-accent" />}
              </button>
            )
          })}
          {collections.length === 0 && (
            <p className="py-3 text-[13px] text-faint">Nie masz jeszcze żadnej kolekcji.</p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            onCreate(name)
            setName('')
          }}
          className="mt-3 flex items-center gap-2 rounded-2xl border border-line p-2 pl-3.5"
        >
          <Icon name="plus" size={16} className="text-faint" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nowa kolekcja…"
            className="w-full text-[13.5px] outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            className="press focus-ring rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-3 py-1.5 text-[12.5px] font-medium text-white"
          >
            Dodaj
          </button>
        </form>

        <button
          onClick={onClose}
          className="press focus-ring mt-3 w-full rounded-2xl border border-line py-2.5 text-[13.5px] text-muted"
        >
          Gotowe
        </button>
      </motion.div>
    </div>
  )
}
