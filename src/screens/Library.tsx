import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { AUTHOR_BY_ID, QUOTE_BY_ID } from '@/data'
import { useStore } from '@/lib/store'
import { tap } from '@/lib/native'
import { Button, EmptyState, PageHeader, Toast } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { QuoteList } from '@/components/QuoteCard'
import { useToast } from '@/hooks/useToast'
import { quoteCount } from '@/lib/text'

type Tab = 'ulubione' | 'kolekcje' | 'notatki'

export default function Library() {
  const [tab, setTab] = useState<Tab>('ulubione')
  const { message, show } = useToast()

  const favorites = useStore((s) => s.favorites)
  const collections = useStore((s) => s.collections)
  const notes = useStore((s) => s.notes)
  const createCollection = useStore((s) => s.createCollection)

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const favQuotes = useMemo(() => favorites.map((id) => QUOTE_BY_ID[id]).filter(Boolean), [favorites])
  const notedQuotes = useMemo(
    () => Object.keys(notes).map((id) => QUOTE_BY_ID[id]).filter(Boolean),
    [notes],
  )

  return (
    <div className="pb-8">
      <PageHeader
        title="Zbiory"
        subtitle="Wszystko, co odłożyłeś na bok — ulubione, własne kolekcje i notatki."
      />

      <div className="px-5 md:px-8">
        <div className="glass inline-flex rounded-2xl p-1">
          {(['ulubione', 'kolekcje', 'notatki'] as Tab[]).map((t) => (
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
                  layoutId="lib-tab"
                  className="absolute inset-0 rounded-xl bg-[color-mix(in_oklab,var(--accent)_26%,transparent)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className={`relative ${tab === t ? 'text-ink' : 'text-muted'}`}>{t}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'ulubione' &&
        (favQuotes.length ? (
          <div className="mt-4">
            <div className="mb-3 px-5 text-[12px] text-faint md:px-8">
              {quoteCount(favQuotes.length)}
            </div>
            <QuoteList quotes={favQuotes} onShared={show} />
          </div>
        ) : (
          <EmptyState
            icon="heart"
            title="Jeszcze pusto"
            text="Dotknij serca przy dowolnym cytacie albo przesuń kartę w prawo w zakładce Talia."
            action={
              <Link to="/przegladaj">
                <Button icon="sparkles">Otwórz talię</Button>
              </Link>
            }
          />
        ))}

      {tab === 'kolekcje' && (
        <div className="mt-4 px-5 md:px-8">
          {creating ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!name.trim()) return
                createCollection(name)
                setName('')
                setCreating(false)
                show('Kolekcja utworzona')
              }}
              className="glass mb-4 flex items-center gap-2 rounded-2xl p-2 pl-4"
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nazwa kolekcji, np. „Na trudne dni”"
                className="w-full text-[14px] outline-none placeholder:text-faint"
              />
              <Button type="submit" icon="check">
                Dodaj
              </Button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                aria-label="Anuluj"
                className="press grid h-10 w-10 place-items-center rounded-xl text-faint"
              >
                <Icon name="close" size={16} />
              </button>
            </form>
          ) : (
            <Button icon="plus" onClick={() => setCreating(true)} variant="glass" full>
              Nowa kolekcja
            </Button>
          )}

          <div className="mt-4 grid gap-2.5 md:grid-cols-2">
            {collections.map((c) => {
              const preview = c.quoteIds
                .slice(0, 1)
                .map((id) => QUOTE_BY_ID[id])
                .filter(Boolean)[0]
              return (
                <Link
                  key={c.id}
                  to={`/zbiory/${c.id}`}
                  className="press focus-ring glass block rounded-2xl p-4 hover:border-line-strong"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-line text-lg">
                      {c.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-medium">{c.name}</span>
                      <span className="block text-[11.5px] text-faint">
                        {quoteCount(c.quoteIds.length)}
                      </span>
                    </span>
                    <Icon name="chevron" size={16} className="text-faint" />
                  </div>
                  {preview && (
                    <p className="quote-serif mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">
                      {preview.pl}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>

          {collections.length === 0 && !creating && (
            <EmptyState
              icon="folder"
              title="Brak kolekcji"
              text="Kolekcje to twoje własne półki — „Na przemowy”, „Stoicyzm”, „Do zapamiętania”."
            />
          )}
        </div>
      )}

      {tab === 'notatki' &&
        (notedQuotes.length ? (
          <div className="mt-4 grid gap-3 px-5 md:grid-cols-2 md:px-8">
            {notedQuotes.map((q) => (
              <Link
                key={q.id}
                to={`/cytat/${q.id}`}
                className="press focus-ring glass block rounded-2xl p-4 hover:border-line-strong"
              >
                <p className="quote-serif line-clamp-2 text-[14px] leading-relaxed">{q.pl}</p>
                <div className="mt-1.5 text-[11.5px] text-faint">
                  {AUTHOR_BY_ID[q.authorId]?.name}
                </div>
                <div className="mt-3 flex gap-2 rounded-xl border border-line p-3 text-[12.5px] leading-relaxed text-muted">
                  <Icon name="note" size={14} className="mt-0.5 shrink-0 text-accent" />
                  <span className="line-clamp-3">{notes[q.id]}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="note"
            title="Brak notatek"
            text="Otwórz dowolny cytat i dopisz, dlaczego chcesz go zapamiętać."
          />
        ))}

      <Toast message={message} />
    </div>
  )
}
