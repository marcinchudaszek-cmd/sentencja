import { AUTHOR_BY_ID, QUOTES, THEME_BY_ID } from '@/data'
import type { Quote } from '@/data/types'

/** Usuwa polskie znaki diakrytyczne i sprowadza tekst do postaci porównywalnej. */
export function normalize(s: string): string {
  return s
    .toLocaleLowerCase('pl')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/[„“”‘’«»']/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface IndexEntry {
  quote: Quote
  text: string
  author: string
  themes: string
  source: string
}

const INDEX: IndexEntry[] = QUOTES.map((q) => {
  const a = AUTHOR_BY_ID[q.authorId]
  return {
    quote: q,
    text: normalize(q.pl + ' ' + (q.original ?? '')),
    author: normalize(a ? `${a.name} ${a.role} ${a.country}` : ''),
    themes: normalize(q.themes.map((t) => THEME_BY_ID[t]?.name ?? '').join(' ')),
    source: normalize(q.source ?? ''),
  }
})

export interface SearchHit {
  quote: Quote
  score: number
}

/**
 * Prosty scoring tokenowy: dopasowanie w treści cytatu waży najwięcej,
 * potem autor, temat i źródło. Wszystkie tokeny muszą wystąpić gdziekolwiek.
 */
export function search(query: string, limit = 60): SearchHit[] {
  const q = normalize(query)
  if (q.length < 2) return []
  const tokens = q.split(' ').filter((t) => t.length > 1)
  if (!tokens.length) return []

  const hits: SearchHit[] = []
  for (const entry of INDEX) {
    let score = 0
    let matchedAll = true

    for (const token of tokens) {
      let tokenScore = 0
      const inText = entry.text.indexOf(token)
      if (inText >= 0) tokenScore += 10 + (isWordStart(entry.text, inText) ? 6 : 0)
      const inAuthor = entry.author.indexOf(token)
      if (inAuthor >= 0) tokenScore += 8 + (isWordStart(entry.author, inAuthor) ? 6 : 0)
      if (entry.themes.includes(token)) tokenScore += 5
      if (entry.source.includes(token)) tokenScore += 3
      if (tokenScore === 0) {
        matchedAll = false
        break
      }
      score += tokenScore
    }

    if (!matchedAll) continue
    // krótsze cytaty przy równym dopasowaniu wyżej
    score += Math.max(0, 120 - entry.quote.pl.length) / 40
    if (entry.text.startsWith(q)) score += 12
    hits.push({ quote: entry.quote, score })
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

function isWordStart(haystack: string, idx: number): boolean {
  return idx === 0 || haystack[idx - 1] === ' '
}

/** Podpowiedzi do pola wyszukiwania — autorzy i tematy pasujące do frazy. */
export function suggestions(query: string, limit = 6) {
  const q = normalize(query)
  if (q.length < 2) return { authors: [], themes: [] }
  const authors = Object.values(AUTHOR_BY_ID)
    .filter((a) => normalize(a.name).includes(q))
    .slice(0, limit)
  const themes = Object.values(THEME_BY_ID)
    .filter((t) => normalize(t.name).includes(q))
    .slice(0, limit)
  return { authors, themes }
}

/** Zaznacza dopasowane fragmenty — zwraca segmenty do wyrenderowania. */
export function highlight(text: string, query: string): { s: string; hit: boolean }[] {
  const tokens = normalize(query).split(' ').filter((t) => t.length > 1)
  if (!tokens.length) return [{ s: text, hit: false }]

  // normalizacja zmienia długość tekstu, więc dopasowujemy całymi słowami
  const out = text.split(/(\s+)/).map((w) => {
    const nw = normalize(w)
    return { s: w, hit: nw.length > 0 && tokens.some((t) => nw.includes(t)) }
  })
  return mergeSegments(out)
}

function mergeSegments(segs: { s: string; hit: boolean }[]) {
  const out: { s: string; hit: boolean }[] = []
  for (const seg of segs) {
    const last = out[out.length - 1]
    if (last && last.hit === seg.hit) last.s += seg.s
    else out.push({ ...seg })
  }
  return out
}
