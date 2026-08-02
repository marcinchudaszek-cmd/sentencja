import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AUTHOR_BY_ID, ERAS, QUOTES, THEMES, THEME_BY_ID } from '@/data'
import type { Quote } from '@/data/types'
import { useStore } from '@/lib/store'
import { shareText, tap } from '@/lib/native'
import { Icon } from '@/components/Icon'
import { EmptyState, PageHeader, Toast } from '@/components/ui'
import { initials, quoteAsText } from '@/components/QuoteCard'
import { useToast } from '@/hooks/useToast'
import { quoteCount } from '@/lib/text'

export default function RandomScreen() {
  const navigate = useNavigate()
  const { message, show } = useToast()

  const [theme, setTheme] = useState<string | null>(null)
  const [era, setEra] = useState<string | null>(null)
  const [tylkoUlubione, setTylkoUlubione] = useState(false)
  const [filtryWidoczne, setFiltryWidoczne] = useState(false)

  const favorites = useStore((s) => s.favorites)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const markSeen = useStore((s) => s.markSeen)
  const hideDisputed = useStore((s) => s.settings.hideDisputed)
  const showOriginal = useStore((s) => s.settings.showOriginal)

  const pula = useMemo(
    () =>
      QUOTES.filter(
        (q) =>
          (!theme || q.themes.includes(theme)) &&
          (!era || AUTHOR_BY_ID[q.authorId]?.era === era) &&
          (!tylkoUlubione || favorites.includes(q.id)) &&
          (!hideDisputed || !q.disputed),
      ),
    [theme, era, tylkoUlubione, favorites, hideDisputed],
  )

  const [quote, setQuote] = useState<Quote | null>(null)
  // Ostatnio wylosowane trzymamy poza stanem — nie wpływają na render.
  const ostatnieCytaty = useRef<string[]>([])
  const ostatniAutorzy = useRef<string[]>([])

  const losuj = useCallback(
    (haptyka = true) => {
      if (!pula.length) {
        setQuote(null)
        return
      }

      // Niektórzy autorzy mają w bazie kilkanaście cytatów, więc czyste
      // losowanie potrafi pokazać tego samego trzy razy pod rząd i sprawia
      // wrażenie zepsutego. Najpierw więc unikamy ostatnich autorów, potem
      // ostatnich cytatów, a dopiero na końcu bierzemy cokolwiek z puli.
      const bezAutorow = pula.filter((q) => !ostatniAutorzy.current.includes(q.authorId))
      const bezCytatow = pula.filter((q) => !ostatnieCytaty.current.includes(q.id))
      const zbior = bezAutorow.length ? bezAutorow : bezCytatow.length ? bezCytatow : pula

      const wybor = zbior[Math.floor(Math.random() * zbior.length)]

      const autorzyWPuli = new Set(pula.map((q) => q.authorId)).size
      ostatniAutorzy.current = [wybor.authorId, ...ostatniAutorzy.current].slice(
        0,
        Math.max(0, Math.min(5, autorzyWPuli - 1)),
      )
      ostatnieCytaty.current = [wybor.id, ...ostatnieCytaty.current].slice(
        0,
        Math.max(0, Math.min(20, pula.length - 1)),
      )

      setQuote(wybor)
      markSeen(wybor.id)
      if (haptyka) tap('medium')
    },
    [pula, markSeen],
  )

  // Zmiana filtrów od razu pokazuje pasujący cytat — bez dodatkowego kliknięcia.
  useEffect(() => {
    ostatnieCytaty.current = []
    ostatniAutorzy.current = []
    losuj(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, era, tylkoUlubione, hideDisputed])

  // Spacja, Enter lub R losują kolejny — ale nigdy wtedy, gdy fokus stoi na
  // przycisku czy polu, bo spacja i enter muszą tam działać po swojemu.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const cel = e.target as HTMLElement | null
      if (cel?.closest('input, textarea, select, button, a, [contenteditable="true"]')) return
      if (e.code === 'Space' || e.code === 'Enter' || e.key.toLowerCase() === 'r') {
        e.preventDefault()
        losuj()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [losuj])

  // Potrząśnięcie telefonem losuje kolejny cytat.
  useEffect(() => {
    if (typeof DeviceMotionEvent === 'undefined') return
    let ostatniWstrzas = 0
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (!a?.x || !a?.y || !a?.z) return
      const sila = Math.hypot(a.x, a.y, a.z)
      const teraz = Date.now()
      if (sila > 26 && teraz - ostatniWstrzas > 1200) {
        ostatniWstrzas = teraz
        losuj()
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [losuj])

  const author = quote ? AUTHOR_BY_ID[quote.authorId] : undefined
  const isFav = quote ? favorites.includes(quote.id) : false
  const filtrAktywny = Boolean(theme || era || tylkoUlubione)
  const autorzyWPuli = useMemo(() => new Set(pula.map((q) => q.authorId)).size, [pula])

  const rozmiar = !quote
    ? ''
    : quote.pl.length > 210
      ? 'text-[1.15rem] leading-[1.5] md:text-[1.4rem]'
      : quote.pl.length > 120
        ? 'text-[1.4rem] leading-[1.42] md:text-[1.8rem]'
        : 'text-[1.7rem] leading-[1.34] md:text-[2.3rem]'

  return (
    <div className="flex min-h-[calc(100dvh-1px)] flex-col pb-4">
      <PageHeader
        eyebrow="jeden przypadkowy"
        title="Losuj"
        subtitle="Dotknij kostki, naciśnij spację albo potrząśnij telefonem."
        right={
          <button
            onClick={() => {
              tap()
              setFiltryWidoczne((v) => !v)
            }}
            aria-label="Filtry"
            className={`press focus-ring glass grid h-10 w-10 place-items-center rounded-full ${
              filtrAktywny ? 'text-accent' : 'text-muted'
            }`}
          >
            <Icon name="filter" size={17} />
          </button>
        }
      />

      {/* Aktywne filtry pokazujemy zawsze, także po zwinięciu panelu —
          inaczej zawężona pula wygląda jak zepsute losowanie. */}
      {filtrAktywny && (
        <div
          role="group"
          aria-label="Aktywne filtry"
          className="mb-1 flex flex-wrap items-center gap-1.5 px-5 md:px-8"
        >
          {tylkoUlubione && (
            <Aktywny onRemove={() => setTylkoUlubione(false)}>❤️ tylko ulubione</Aktywny>
          )}
          {theme && (
            <Aktywny onRemove={() => setTheme(null)}>
              {THEME_BY_ID[theme]?.emoji} {THEME_BY_ID[theme]?.name}
            </Aktywny>
          )}
          {era && (
            <Aktywny onRemove={() => setEra(null)}>{ERAS.find((e) => e.id === era)?.name}</Aktywny>
          )}
          <button
            onClick={() => {
              tap()
              setTheme(null)
              setEra(null)
              setTylkoUlubione(false)
            }}
            className="press focus-ring ml-1 text-[11.5px] text-faint hover:text-ink"
          >
            wyczyść wszystkie
          </button>
        </div>
      )}

      {filtryWidoczne && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden px-5 md:px-8"
        >
          <div className="glass rounded-2xl p-4">
            <button
              onClick={() => {
                tap()
                setTylkoUlubione((v) => !v)
              }}
              className={`press focus-ring mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] ${
                tylkoUlubione
                  ? 'border-transparent bg-[color-mix(in_oklab,var(--accent)_26%,transparent)] text-ink'
                  : 'border-line text-muted'
              }`}
            >
              <Icon name={tylkoUlubione ? 'heart-fill' : 'heart'} size={13} />
              Tylko ulubione
            </button>

            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
              Temat
            </div>
            <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto pb-1">
              <Mini active={!theme} onClick={() => setTheme(null)}>
                dowolny
              </Mini>
              {THEMES.map((t) => (
                <Mini key={t.id} active={theme === t.id} onClick={() => setTheme(theme === t.id ? null : t.id)}>
                  {t.emoji} {t.name}
                </Mini>
              ))}
            </div>

            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-faint">
              Epoka
            </div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
              <Mini active={!era} onClick={() => setEra(null)}>
                dowolna
              </Mini>
              {ERAS.map((e) => (
                <Mini key={e.id} active={era === e.id} onClick={() => setEra(era === e.id ? null : e.id)}>
                  {e.name}
                </Mini>
              ))}
            </div>

          </div>
        </motion.div>
      )}

      <div className="mx-auto mt-3 flex w-full max-w-2xl flex-1 flex-col px-5 md:px-8">
        {quote && author ? (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong relative flex flex-1 flex-col overflow-hidden rounded-[1.9rem] p-6 shadow-[var(--shadow)] md:p-8"
          >
            <div
              className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full opacity-50 blur-3xl"
              style={{ background: 'radial-gradient(circle, var(--accent), transparent 65%)' }}
            />
            <Icon name="quote" size={26} className="mb-4 shrink-0 text-accent opacity-70" />

            <button
              onClick={() => navigate(`/cytat/${quote.id}`)}
              className="focus-ring flex-1 text-left"
              aria-label="Otwórz cytat"
            >
              <p className={`quote-serif tracking-[-0.015em] ${rozmiar}`}>{quote.pl}</p>
              {showOriginal && quote.original && (
                <p lang={quote.lang} className="mt-4 text-[12.5px] leading-relaxed text-faint italic">
                  {quote.original}
                </p>
              )}
            </button>

            <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
              <Link to={`/autor/${quote.authorId}`} className="focus-ring flex min-w-0 flex-1 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-[11px] font-semibold text-muted">
                  {initials(author.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium">{author.name}</span>
                  <span className="block truncate text-[11.5px] text-faint">
                    {author.role}
                    {quote.disputed && ' · atrybucja sporna'}
                  </span>
                </span>
              </Link>

              <button
                onClick={() => {
                  tap()
                  toggleFavorite(quote.id)
                }}
                aria-label={isFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                className={`press focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  isFav ? 'text-rose-400' : 'text-faint hover:text-ink'
                }`}
              >
                <Icon name={isFav ? 'heart-fill' : 'heart'} size={18} />
              </button>
              <button
                onClick={async () => {
                  tap()
                  const r = await shareText('Cytat', quoteAsText(quote))
                  if (r === 'copied') show('Skopiowano do schowka')
                }}
                aria-label="Udostępnij"
                className="press focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full text-faint hover:text-ink"
              >
                <Icon name="share" size={17} />
              </button>
            </div>

            {quote.themes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {quote.themes.map((t) => {
                  const th = THEME_BY_ID[t]
                  return th ? (
                    <button
                      key={t}
                      onClick={() => {
                        tap()
                        setTheme(t)
                        setFiltryWidoczne(true)
                      }}
                      className="press focus-ring rounded-full border border-line px-2.5 py-1 text-[11px] text-faint hover:text-ink"
                    >
                      {th.emoji} {th.name}
                    </button>
                  ) : null
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <EmptyState
            icon="dice"
            title="Nic do wylosowania"
            text={
              tylkoUlubione
                ? 'Nie masz jeszcze ulubionych pasujących do tych filtrów.'
                : 'Żaden cytat nie pasuje do wybranych filtrów.'
            }
          />
        )}

        <button
          onClick={() => losuj()}
          disabled={!pula.length}
          className="press focus-ring mt-5 flex w-full items-center justify-center gap-3 rounded-[1.4rem] bg-gradient-to-br from-violet-500 to-fuchsia-500 py-4 text-[15px] font-semibold text-white shadow-lg shadow-violet-900/25 disabled:opacity-40"
        >
          <Icon name="dice" size={20} />
          Losuj kolejny
        </button>

        <p className="mt-3 text-center text-[11.5px] text-faint">
          Losowanie z {quoteCount(pula.length)} · {autorzyWPuli}{' '}
          {autorzyWPuli === 1 ? 'autor' : 'autorów'}
          {filtrAktywny && ' (po filtrach)'}
        </p>
      </div>

      <Toast message={message} />
    </div>
  )
}

function Aktywny({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <button
      onClick={() => {
        tap()
        onRemove()
      }}
      className="press focus-ring inline-flex items-center gap-1.5 rounded-full border border-transparent bg-[color-mix(in_oklab,var(--accent)_26%,transparent)] px-2.5 py-1 text-[11.5px] text-ink"
    >
      {children}
      <Icon name="close" size={11} />
    </button>
  )
}

function Mini({
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
      className={`press focus-ring shrink-0 rounded-full border px-2.5 py-1 text-[11.5px] ${
        active
          ? 'border-transparent bg-[color-mix(in_oklab,var(--accent)_26%,transparent)] text-ink'
          : 'border-line text-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
