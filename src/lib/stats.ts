import { AUTHORS_WITH_QUOTES, AUTHOR_BY_ID, ERAS, QUOTES, THEMES, authorQuoteCount } from '@/data'
import type { Author, EraId } from '@/data/types'

export interface PunktOsi {
  author: Author
  rok: number
  cytaty: number
}

/**
 * Autorzy z datą urodzenia, uporządkowani chronologicznie. Kilku postaci
 * (przysłowia, autorzy anonimowi) nie da się umieścić na osi — pomijamy ich
 * świadomie, zamiast zgadywać rok.
 */
export const PUNKTY_OSI: PunktOsi[] = AUTHORS_WITH_QUOTES.filter((a) => typeof a.born === 'number')
  .map((a) => ({ author: a, rok: a.born as number, cytaty: authorQuoteCount(a.id) }))
  .sort((a, b) => a.rok - b.rok)

export const BEZ_DATY = AUTHORS_WITH_QUOTES.filter((a) => typeof a.born !== 'number')

/**
 * Oś dzielimy na odcinki i każdemu dajemy szerokość zależną od liczby autorów.
 * Skala liniowa ścisnęłaby dwadzieścia sześć wieków tak, że antyk byłby
 * kreską, a XX wiek plamą — tu każdy okres dostaje tyle miejsca, ile ma treści.
 */
const GRANICE = [-800, -400, -200, 0, 200, 500, 1000, 1300, 1450, 1600, 1700, 1800, 1870, 1920, 1960, 2000]

export interface Odcinek {
  od: number
  do: number
  x: number
  szerokosc: number
  autorzy: number
}

const MIN_SZEROKOSC = 60
const PIKSELE_NA_AUTORA = 34

export const ODCINKI: Odcinek[] = (() => {
  const out: Odcinek[] = []
  let x = 0
  for (let i = 0; i < GRANICE.length - 1; i++) {
    const od = GRANICE[i]
    const doo = GRANICE[i + 1]
    const autorzy = PUNKTY_OSI.filter((p) => p.rok >= od && p.rok < doo).length
    const szerokosc = Math.max(MIN_SZEROKOSC, autorzy * PIKSELE_NA_AUTORA)
    out.push({ od, do: doo, x, szerokosc, autorzy })
    x += szerokosc
  }
  return out
})()

export const SZEROKOSC_OSI = ODCINKI.reduce((s, o) => s + o.szerokosc, 0)

/** Rok → pozycja w pikselach na osi. */
export function rokNaX(rok: number): number {
  const pierwszy = ODCINKI[0]
  const ostatni = ODCINKI[ODCINKI.length - 1]
  if (rok <= pierwszy.od) return 0
  if (rok >= ostatni.do) return SZEROKOSC_OSI
  const odcinek = ODCINKI.find((o) => rok >= o.od && rok < o.do) ?? ostatni
  const udzial = (rok - odcinek.od) / (odcinek.do - odcinek.od)
  return odcinek.x + udzial * odcinek.szerokosc
}

/** Zakres osi zajmowany przez epokę — do narysowania tła. */
export function zakresEpoki(era: EraId): { x: number; szerokosc: number } {
  const lata = PUNKTY_OSI.filter((p) => p.author.era === era).map((p) => p.rok)
  if (!lata.length) return { x: 0, szerokosc: 0 }
  const x = rokNaX(Math.min(...lata))
  const koniec = rokNaX(Math.max(...lata))
  return { x, szerokosc: Math.max(koniec - x, 8) }
}

/** Rozkłada punkty na pasy tak, by kółka na siebie nie nachodziły. */
export function przypiszPasy(punkty: PunktOsi[], odstep = 26): number[] {
  const ostatniX: number[] = []
  return punkty.map((p) => {
    const x = rokNaX(p.rok)
    let pas = ostatniX.findIndex((last) => x - last >= odstep)
    if (pas === -1) {
      pas = ostatniX.length
      ostatniX.push(x)
    } else {
      ostatniX[pas] = x
    }
    return pas
  })
}

export interface KomorkaTematu {
  temat: string
  nazwa: string
  emoji: string
  wartosci: { era: EraId; ile: number; udzial: number }[]
  suma: number
}

/** Udział tematu w każdej epoce — do siatki gęstości. */
export const TEMATY_W_CZASIE: KomorkaTematu[] = THEMES.map((t) => {
  const wartosci = ERAS.map((e) => {
    const wEpoce = QUOTES.filter((q) => AUTHOR_BY_ID[q.authorId]?.era === e.id)
    const ile = wEpoce.filter((q) => q.themes.includes(t.id)).length
    return { era: e.id, ile, udzial: wEpoce.length ? ile / wEpoce.length : 0 }
  })
  return {
    temat: t.id,
    nazwa: t.name,
    emoji: t.emoji,
    wartosci,
    suma: wartosci.reduce((s, w) => s + w.ile, 0),
  }
})
  .sort((a, b) => b.suma - a.suma)
  .slice(0, 12)

export const MAKS_UDZIAL = Math.max(
  ...TEMATY_W_CZASIE.flatMap((t) => t.wartosci.map((w) => w.udzial)),
)

export interface Kraj {
  nazwa: string
  autorzy: number
  cytaty: number
}

export const KRAJE: Kraj[] = (() => {
  const mapa = new Map<string, Kraj>()
  for (const a of AUTHORS_WITH_QUOTES) {
    const wpis = mapa.get(a.country) ?? { nazwa: a.country, autorzy: 0, cytaty: 0 }
    wpis.autorzy += 1
    wpis.cytaty += authorQuoteCount(a.id)
    mapa.set(a.country, wpis)
  }
  return [...mapa.values()].sort((a, b) => b.cytaty - a.cytaty)
})()

/** Zapis roku na osi: 400 p.n.e. / 1564. */
export function etykietaRoku(rok: number): string {
  return rok < 0 ? `${-rok} p.n.e.` : `${rok}`
}
