import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ERAS, ERA_BY_ID, STATS, lifespan } from '@/data'
import {
  BEZ_DATY,
  KRAJE,
  MAKS_UDZIAL,
  ODCINKI,
  PUNKTY_OSI,
  SZEROKOSC_OSI,
  TEMATY_W_CZASIE,
  etykietaRoku,
  przypiszPasy,
  rokNaX,
  zakresEpoki,
} from '@/lib/stats'
import type { PunktOsi } from '@/lib/stats'
import { PageHeader, Section } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { initials } from '@/components/QuoteCard'
import { tap } from '@/lib/native'
import { quoteCount } from '@/lib/text'

const WYS_PASA = 24
const GORA = 44

/**
 * Własne przewijanie zamiast scrollTo({behavior:'smooth'}) — to ostatnie bywa
 * ignorowane w osadzonych przeglądarkach i w WebView, a wtedy oś po prostu
 * nie drgnie. Ustawienie „ogranicz ruch" respektujemy skokiem.
 */
function przewin(el: HTMLElement | null, docelowy: number, czas = 420) {
  if (!el) return
  const start = el.scrollLeft
  const dystans = docelowy - start
  if (Math.abs(dystans) < 2) return
  // Bez klatek (ukryta karta, oszczędzanie energii) animacja nigdy by nie
  // wystartowała i oś zostałaby w miejscu — wtedy przewijamy skokiem.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) {
    el.scrollLeft = docelowy
    return
  }
  const poczatek = performance.now()
  let ruszylo = false
  const krok = (teraz: number) => {
    ruszylo = true
    const t = Math.min(1, (teraz - poczatek) / czas)
    const wygladzone = 1 - Math.pow(1 - t, 3)
    el.scrollLeft = start + dystans * wygladzone
    if (t < 1) requestAnimationFrame(krok)
  }
  requestAnimationFrame(krok)
  window.setTimeout(() => {
    if (!ruszylo) el.scrollLeft = docelowy
  }, 120)
}

export default function TimelineScreen() {
  const [wybrany, setWybrany] = useState<PunktOsi | null>(null)
  const [era, setEra] = useState<string | null>(null)
  const osRef = useRef<HTMLDivElement>(null)

  const pasy = useMemo(() => przypiszPasy(PUNKTY_OSI), [])
  const liczbaPasow = Math.max(...pasy) + 1
  const wysokosc = GORA + liczbaPasow * WYS_PASA + 16

  const przewinDoEpoki = (id: string) => {
    tap()
    setEra(id === era ? null : id)
    const { x } = zakresEpoki(id as never)
    przewin(osRef.current, Math.max(0, x - 40))
  }

  return (
    <div className="pb-10">
      <PageHeader
        back
        eyebrow="26 wieków myśli"
        title="Oś czasu"
        subtitle={`${PUNKTY_OSI.length} autorów z datą urodzenia, od Homera po dziś. Każdy okres dostaje tyle miejsca, ile ma treści — dlatego skala nie jest liniowa.`}
      />

      {/* ——— skróty do epok ——— */}
      <div className="no-scrollbar mask-fade-r mb-3 flex gap-2 overflow-x-auto px-5 md:px-8">
        {ERAS.map((e) => (
          <button
            key={e.id}
            onClick={() => przewinDoEpoki(e.id)}
            className={`press focus-ring shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] ${
              era === e.id
                ? 'border-transparent bg-[color-mix(in_oklab,var(--accent)_26%,transparent)] text-ink'
                : 'border-line text-muted hover:text-ink'
            }`}
          >
            {e.name}
          </button>
        ))}
      </div>

      {/* ——— oś ——— */}
      <div
        ref={osRef}
        className="no-scrollbar overflow-x-auto px-5 pb-2 md:px-8"
        role="group"
        aria-label="Oś czasu autorów — przewijana w poziomie"
      >
        <svg
          width={SZEROKOSC_OSI + 40}
          height={wysokosc}
          className="overflow-visible"
          role="img"
          aria-label={`Rozmieszczenie ${PUNKTY_OSI.length} autorów w czasie`}
        >
          {/* pasma epok */}
          {ERAS.map((e) => {
            const { x, szerokosc } = zakresEpoki(e.id)
            const przygaszone = era && era !== e.id
            return (
              <g key={e.id} opacity={przygaszone ? 0.25 : 1}>
                <rect
                  x={x + 20}
                  y={12}
                  width={szerokosc}
                  height={wysokosc - 24}
                  rx={10}
                  fill="var(--surface)"
                  stroke="var(--border)"
                />
                <text
                  x={x + 28}
                  y={28}
                  className="fill-[var(--faint)]"
                  style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}
                >
                  {e.name}
                </text>
              </g>
            )
          })}

          {/* podziałka lat */}
          {ODCINKI.map((o) => (
            <text
              key={o.od}
              x={rokNaX(o.od) + 22}
              y={wysokosc - 2}
              className="fill-[var(--faint)]"
              style={{ fontSize: 9 }}
            >
              {etykietaRoku(o.od)}
            </text>
          ))}

          {/* autorzy */}
          {PUNKTY_OSI.map((p, i) => {
            const x = rokNaX(p.rok) + 20
            const y = GORA + pasy[i] * WYS_PASA
            const r = Math.min(4 + p.cytaty * 0.9, 11)
            const aktywny = wybrany?.author.id === p.author.id
            const przygaszony = era && era !== p.author.era
            return (
              <g
                key={p.author.id}
                opacity={przygaszony ? 0.2 : 1}
                onClick={() => {
                  tap()
                  setWybrany(aktywny ? null : p)
                }}
                style={{ cursor: 'pointer' }}
              >
                <title>{`${p.author.name} — ${lifespan(p.author)}, ${quoteCount(p.cytaty)}`}</title>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={aktywny ? 'var(--accent)' : 'var(--surface-2)'}
                  stroke={aktywny ? 'var(--accent)' : 'var(--border-strong)'}
                  strokeWidth={aktywny ? 3 : 1.5}
                />
                {p.cytaty >= 4 && (
                  <text
                    x={x + r + 5}
                    y={y + 3.5}
                    className="fill-[var(--muted)]"
                    style={{ fontSize: 10.5 }}
                  >
                    {p.author.name}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      <p className="px-5 text-[11px] text-faint md:px-8">
        Wielkość kółka to liczba cytatów. Dotknij, by zobaczyć szczegóły.
        {BEZ_DATY.length > 0 &&
          ` ${BEZ_DATY.length} autorów bez znanej daty urodzenia nie mieści się na osi.`}
      </p>

      {/* ——— wybrany autor ——— */}
      {wybrany && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 px-5 md:px-8"
        >
          <Link
            to={`/autor/${wybrany.author.id}`}
            className="press focus-ring glass flex items-center gap-3.5 rounded-2xl p-4"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/25 to-cyan-400/20 text-[13px] font-semibold">
              {initials(wybrany.author.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-medium">{wybrany.author.name}</span>
              <span className="block truncate text-[12px] text-faint">
                {wybrany.author.role} · {lifespan(wybrany.author)} ·{' '}
                {ERA_BY_ID[wybrany.author.era]?.name}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-muted">
                {quoteCount(wybrany.cytaty)} w bazie
              </span>
            </span>
            <Icon name="chevron" size={16} className="text-faint" />
          </Link>
        </motion.div>
      )}

      {/* ——— tematy w czasie ——— */}
      <Section title="Tematy w czasie" icon="tag">
        <div className="px-5 md:px-8">
          <p className="mb-3 text-[12px] leading-relaxed text-faint">
            Im ciemniejsze pole, tym większy udział tematu wśród cytatów danej epoki. Widać, jak
            wiara ustępuje miejsca człowiekowi, a prawda zyskuje na znaczeniu w nowoczesności.
          </p>

          <div className="no-scrollbar overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-left">
              <caption className="sr-only">
                Udział tematów w poszczególnych epokach, w procentach cytatów epoki
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="pb-2 text-[10.5px] font-medium text-faint">
                    Temat
                  </th>
                  {ERAS.map((e) => (
                    <th
                      key={e.id}
                      scope="col"
                      className="pb-2 text-center text-[10px] font-medium text-faint"
                    >
                      {e.name.replace('Wiek ', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEMATY_W_CZASIE.map((t) => (
                  <tr key={t.temat}>
                    <th scope="row" className="py-1 pr-2 text-[12px] font-normal whitespace-nowrap">
                      <Link to={`/temat/${t.temat}`} className="focus-ring hover:text-accent">
                        {t.emoji} {t.nazwa}
                      </Link>
                    </th>
                    {t.wartosci.map((w) => (
                      <td key={w.era} className="p-0.5">
                        <div
                          className="grid h-8 place-items-center rounded-md text-[10px] tabular-nums"
                          style={{
                            background: `color-mix(in oklab, var(--accent) ${Math.round((w.udzial / MAKS_UDZIAL) * 72)}%, transparent)`,
                            color: w.udzial / MAKS_UDZIAL > 0.55 ? 'var(--text)' : 'var(--faint)',
                          }}
                          title={`${t.nazwa}, ${ERA_BY_ID[w.era]?.name}: ${w.ile} cytatów`}
                        >
                          {w.ile || ''}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ——— kraje ——— */}
      <Section title="Skąd pochodzą" icon="globe">
        <div className="px-5 md:px-8">
          <p className="mb-3 text-[12px] text-faint">
            {STATS.countries} krajów i kultur. Liczba to cytaty w bazie.
          </p>
          <ul className="space-y-1.5">
            {KRAJE.slice(0, 14).map((k) => (
              <li key={k.nazwa} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-[12.5px]">{k.nazwa}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    style={{ width: `${(k.cytaty / KRAJE[0].cytaty) * 100}%` }}
                  />
                </span>
                <span className="w-14 shrink-0 text-right text-[11.5px] tabular-nums text-faint">
                  {k.cytaty}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  )
}

export function LinkDoOsi() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/os-czasu')}
      className="press focus-ring glass relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-4 text-left"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20">
        <Icon name="clock" size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium">Oś czasu</span>
        <span className="block text-[11.5px] text-faint">
          {PUNKTY_OSI.length} autorów na skali 26 wieków
        </span>
      </span>
      <Icon name="chevron" size={16} className="text-faint" />
    </button>
  )
}
