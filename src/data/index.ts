import type { Author, Quote, QuoteTuple, QuoteWithMeta } from './types'
import { AUTHOR_BY_ID, AUTHORS, lifespan } from './authors'
import { ERA_BY_ID, ERAS, THEME_BY_ID, THEMES } from './taxonomy'
import { QUOTES_ANTYK } from './quotes-antyk'
import { QUOTES_KLASYKA } from './quotes-klasyka'
import { QUOTES_XIX } from './quotes-xix'
import { QUOTES_XX } from './quotes-xx'

const ALL_TUPLES: QuoteTuple[] = [...QUOTES_ANTYK, ...QUOTES_KLASYKA, ...QUOTES_XIX, ...QUOTES_XX]

function fromTuple([id, pl, original, lang, authorId, themes, source, disputed]: QuoteTuple): Quote {
  return {
    id,
    pl,
    original: original || undefined,
    lang: lang || undefined,
    authorId,
    themes,
    source: source || undefined,
    disputed: disputed === 1 || undefined,
  }
}

export const QUOTES: Quote[] = ALL_TUPLES.map(fromTuple)
export const QUOTE_BY_ID = Object.fromEntries(QUOTES.map((q) => [q.id, q])) as Record<string, Quote>

/** Autorzy, którzy mają w bazie choć jeden cytat. */
export const AUTHORS_WITH_QUOTES: Author[] = AUTHORS.filter((a) =>
  QUOTES.some((q) => q.authorId === a.id),
)

const byAuthor = new Map<string, Quote[]>()
const byTheme = new Map<string, Quote[]>()
const byEra = new Map<string, Quote[]>()

for (const q of QUOTES) {
  const a = AUTHOR_BY_ID[q.authorId]
  if (!a) continue
  if (!byAuthor.has(q.authorId)) byAuthor.set(q.authorId, [])
  byAuthor.get(q.authorId)!.push(q)
  if (!byEra.has(a.era)) byEra.set(a.era, [])
  byEra.get(a.era)!.push(q)
  for (const t of q.themes) {
    if (!byTheme.has(t)) byTheme.set(t, [])
    byTheme.get(t)!.push(q)
  }
}

export const quotesByAuthor = (id: string): Quote[] => byAuthor.get(id) ?? []
export const quotesByTheme = (id: string): Quote[] => byTheme.get(id) ?? []
export const quotesByEra = (id: string): Quote[] => byEra.get(id) ?? []

export const authorQuoteCount = (id: string): number => byAuthor.get(id)?.length ?? 0
export const themeQuoteCount = (id: string): number => byTheme.get(id)?.length ?? 0
export const eraQuoteCount = (id: string): number => byEra.get(id)?.length ?? 0

export function withMeta(q: Quote): QuoteWithMeta {
  const author = AUTHOR_BY_ID[q.authorId]
  return {
    ...q,
    author,
    era: ERA_BY_ID[author.era],
    themeList: q.themes.map((t) => THEME_BY_ID[t]).filter(Boolean),
  }
}

export const STATS = {
  quotes: QUOTES.length,
  authors: AUTHORS_WITH_QUOTES.length,
  themes: THEMES.length,
  eras: ERAS.length,
  countries: new Set(AUTHORS_WITH_QUOTES.map((a) => a.country)).size,
}

// Sanity-check bazy tylko w trybie deweloperskim.
if (import.meta.env.DEV) {
  const problems: string[] = []
  const seen = new Set<string>()
  for (const q of QUOTES) {
    if (seen.has(q.id)) problems.push(`zduplikowane id: ${q.id}`)
    seen.add(q.id)
    if (!AUTHOR_BY_ID[q.authorId]) problems.push(`${q.id}: nieznany autor „${q.authorId}"`)
    for (const t of q.themes) if (!THEME_BY_ID[t]) problems.push(`${q.id}: nieznany temat „${t}"`)
    if (!q.themes.length) problems.push(`${q.id}: brak tematów`)
  }
  for (const a of AUTHORS) if (!ERA_BY_ID[a.era]) problems.push(`autor ${a.id}: nieznana epoka`)
  if (problems.length) console.warn('[baza cytatów] problemy:\n' + problems.join('\n'))
}

export { AUTHORS, AUTHOR_BY_ID, ERAS, ERA_BY_ID, THEMES, THEME_BY_ID, lifespan }
export type { Author, Quote, QuoteWithMeta }
