import { QUOTES } from '@/data'
import type { Quote } from '@/data/types'

/** Stabilny hash łańcucha (FNV-1a) — ten sam wynik na webie i na Androidzie. */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Cytat dnia — deterministyczny dla danej daty, bez powtórek w cyklu roku. */
export function quoteOfTheDay(d = new Date()): Quote {
  const idx = hashString('sentencja:' + dateKey(d)) % QUOTES.length
  return QUOTES[idx]
}

export function quoteOfTheDayFor(offsetDays: number): Quote {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return quoteOfTheDay(d)
}

const MIESIACE = [
  'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
  'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
]
const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']

export function formatPolishDate(d = new Date()): string {
  return `${DNI[d.getDay()]}, ${d.getDate()} ${MIESIACE[d.getMonth()]}`
}

/** Losowy cytat z opcjonalnym pominięciem ostatnio pokazanych. */
export function randomQuote(exclude: string[] = []): Quote {
  const pool = QUOTES.length > exclude.length ? QUOTES.filter((q) => !exclude.includes(q.id)) : QUOTES
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Deterministyczna tasowana talia — do trybu „przeglądaj". */
export function shuffled(seed: string): Quote[] {
  const arr = [...QUOTES]
  let s = hashString(seed) || 1
  const rnd = () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 100000) / 100000
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
