import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { AUTHOR_BY_ID, THEMES, THEME_BY_ID } from '@/data'
import type { Quote } from '@/data/types'
import { dateKey, shuffled } from '@/lib/daily'
import { useStore } from '@/lib/store'
import { shareText, tap } from '@/lib/native'
import { Icon } from '@/components/Icon'
import { PageHeader, Toast } from '@/components/ui'
import { initials, quoteAsText } from '@/components/QuoteCard'
import { useToast } from '@/hooks/useToast'

export default function BrowseScreen() {
  const navigate = useNavigate()
  const { message, show } = useToast()
  const [theme, setTheme] = useState<string | null>(null)
  const [i, setI] = useState(0)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const favorites = useStore((s) => s.favorites)
  const markSeen = useStore((s) => s.markSeen)
  const hideDisputed = useStore((s) => s.settings.hideDisputed)

  const deck = useMemo(
    () =>
      shuffled(dateKey()).filter(
        (q) => (!theme || q.themes.includes(theme)) && (!hideDisputed || !q.disputed),
      ),
    [theme, hideDisputed],
  )

  const at = (offset: number): Quote | undefined =>
    deck.length ? deck[(i + offset) % deck.length] : undefined
  const current = at(0)

  const advance = (liked: boolean) => {
    if (!current) return
    if (liked && !favorites.includes(current.id)) toggleFavorite(current.id)
    markSeen(current.id)
    tap(liked ? 'medium' : 'light')
    setI((v) => v + 1)
  }

  return (
    <div className="flex min-h-[calc(100dvh-1px)] flex-col">
      <PageHeader
        title="Talia"
        eyebrow="przesuwaj i zapisuj"
        subtitle="W prawo — do ulubionych. W lewo — dalej. Dotknij, by otworzyć."
      />

      <div className="no-scrollbar mask-fade-r flex gap-2 overflow-x-auto px-5 pb-2 md:px-8">
        <TabChip active={!theme} onClick={() => { setTheme(null); setI(0) }}>
          Wszystko
        </TabChip>
        {THEMES.map((t) => (
          <TabChip
            key={t.id}
            active={theme === t.id}
            onClick={() => {
              setTheme(theme === t.id ? null : t.id)
              setI(0)
            }}
          >
            {t.emoji} {t.name}
          </TabChip>
        ))}
      </div>

      <div className="relative mx-auto mt-3 w-full max-w-md flex-1 px-5">
        <div className="relative h-[26rem] md:h-[28rem]">
          {at(2) && <StackCard depth={2} />}
          {at(1) && <StackCard depth={1} />}
          {current ? (
            <SwipeCard
              key={current.id}
              quote={current}
              onSwipe={advance}
              onOpen={() => navigate(`/cytat/${current.id}`)}
            />
          ) : (
            <div className="glass grid h-full place-items-center rounded-[1.9rem] p-8 text-center">
              <div>
                <Icon name="sparkles" size={28} className="mx-auto mb-3 text-accent" />
                <p className="text-[14px] text-muted">Brak cytatów dla tego filtra.</p>
              </div>
            </div>
          )}
        </div>

        {current && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => advance(false)}
              aria-label="Dalej"
              className="press focus-ring glass grid h-14 w-14 place-items-center rounded-full text-muted"
            >
              <Icon name="close" size={22} />
            </button>
            <button
              onClick={async () => {
                const r = await shareText('Cytat', quoteAsText(current))
                if (r === 'copied') show('Skopiowano do schowka')
              }}
              aria-label="Udostępnij"
              className="press focus-ring glass grid h-12 w-12 place-items-center rounded-full text-muted"
            >
              <Icon name="share" size={18} />
            </button>
            <button
              onClick={() => advance(true)}
              aria-label="Do ulubionych"
              className="press focus-ring grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-500 text-white shadow-lg shadow-rose-900/30"
            >
              <Icon name="heart-fill" size={22} />
            </button>
          </div>
        )}

        <p className="mt-4 pb-6 text-center text-[11.5px] tabular-nums text-faint">
          {deck.length > 0 ? `${(i % deck.length) + 1} / ${deck.length}` : '—'}
        </p>
      </div>

      <Toast message={message} />
    </div>
  )
}

function StackCard({ depth }: { depth: number }) {
  return (
    <div
      className="glass absolute inset-0 rounded-[1.9rem]"
      style={{
        transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.04})`,
        opacity: 1 - depth * 0.35,
      }}
      aria-hidden
    />
  )
}

function SwipeCard({
  quote,
  onSwipe,
  onOpen,
}: {
  quote: Quote
  onSwipe: (liked: boolean) => void
  onOpen: () => void
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-260, 260], [-11, 11])
  const likeOpacity = useTransform(x, [40, 150], [0, 1])
  const skipOpacity = useTransform(x, [-150, -40], [1, 0])
  const author = AUTHOR_BY_ID[quote.authorId]

  const size =
    quote.pl.length > 190
      ? 'text-[1.05rem] leading-[1.5]'
      : quote.pl.length > 110
        ? 'text-[1.25rem] leading-[1.45]'
        : 'text-[1.5rem] leading-[1.35]'

  return (
    <motion.div
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.55}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120 || info.velocity.x > 700) onSwipe(true)
        else if (info.offset.x < -120 || info.velocity.x < -700) onSwipe(false)
      }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-strong absolute inset-0 cursor-grab overflow-hidden rounded-[1.9rem] p-6 shadow-[var(--shadow)] active:cursor-grabbing md:p-7"
    >
      <motion.div
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute top-6 left-6 z-10 rounded-xl border-2 border-rose-400 px-3 py-1 text-[13px] font-bold tracking-wide text-rose-400"
      >
        ZAPISZ
      </motion.div>
      <motion.div
        style={{ opacity: skipOpacity }}
        className="pointer-events-none absolute top-6 right-6 z-10 rounded-xl border-2 border-zinc-400 px-3 py-1 text-[13px] font-bold tracking-wide text-zinc-400"
      >
        DALEJ
      </motion.div>

      <button onClick={onOpen} className="focus-ring flex h-full w-full flex-col text-left">
        <Icon name="quote" size={24} className="mb-4 shrink-0 text-accent opacity-60" />
        <p className={`quote-serif flex-1 tracking-[-0.01em] ${size}`}>{quote.pl}</p>

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-[11px] font-semibold text-muted">
            {initials(author?.name ?? '')}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium">{author?.name}</span>
            <span className="block truncate text-[11.5px] text-faint">{author?.role}</span>
          </span>
        </div>
      </button>

      <div className="pointer-events-none absolute right-5 bottom-5 flex gap-1.5">
        {quote.themes.slice(0, 2).map((t) => (
          <span key={t} className="rounded-full border border-line px-2 py-0.5 text-[10.5px] text-faint">
            {THEME_BY_ID[t]?.emoji}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

function TabChip({
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
