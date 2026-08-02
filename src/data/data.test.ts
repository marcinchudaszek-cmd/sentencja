import { describe, expect, it } from 'vitest'
import { AUTHORS, AUTHOR_BY_ID, ERA_BY_ID, QUOTES, THEMES, THEME_BY_ID, lifespan } from './index'
import { AUTHORS_WITH_QUOTES, quotesByAuthor, quotesByTheme } from './index'

/**
 * Baza jest pisana ręcznie w czterech plikach, więc literówka w authorId albo
 * temacie jest najbardziej prawdopodobnym błędem. Te testy łapią ją zanim
 * trafi do aplikacji.
 */
describe('spójność bazy cytatów', () => {
  it('każdy cytat wskazuje istniejącego autora', () => {
    const zle = QUOTES.filter((q) => !AUTHOR_BY_ID[q.authorId]).map((q) => `${q.id} → ${q.authorId}`)
    expect(zle).toEqual([])
  })

  it('każdy cytat ma wyłącznie znane tematy', () => {
    const zle = QUOTES.flatMap((q) =>
      q.themes.filter((t) => !THEME_BY_ID[t]).map((t) => `${q.id} → ${t}`),
    )
    expect(zle).toEqual([])
  })

  it('każdy cytat ma co najmniej jeden temat', () => {
    expect(QUOTES.filter((q) => q.themes.length === 0).map((q) => q.id)).toEqual([])
  })

  it('identyfikatory cytatów są unikalne', () => {
    const widziane = new Set<string>()
    const duplikaty = QUOTES.filter((q) => (widziane.has(q.id) ? true : (widziane.add(q.id), false)))
    expect(duplikaty.map((q) => q.id)).toEqual([])
  })

  it('identyfikatory autorów są unikalne', () => {
    const widziane = new Set<string>()
    const duplikaty = AUTHORS.filter((a) => (widziane.has(a.id) ? true : (widziane.add(a.id), false)))
    expect(duplikaty.map((a) => a.id)).toEqual([])
  })

  it('treść cytatu i autor nigdy nie są puste', () => {
    const zle = QUOTES.filter((q) => !q.pl.trim() || !q.authorId.trim()).map((q) => q.id)
    expect(zle).toEqual([])
  })

  it('cytat nie jest opakowany w cudzysłowy — te dokłada interfejs', () => {
    const zle = QUOTES.filter((q) => /^["„»]/.test(q.pl.trim())).map((q) => q.id)
    expect(zle).toEqual([])
  })

  it('cytat kończy się znakiem interpunkcyjnym', () => {
    const zle = QUOTES.filter((q) => !/[.!?…"]$/.test(q.pl.trim())).map((q) => `${q.id}: ${q.pl}`)
    expect(zle).toEqual([])
  })

  it('oryginał, jeśli podany, ma określony język', () => {
    const zle = QUOTES.filter((q) => q.original && !q.lang).map((q) => q.id)
    expect(zle).toEqual([])
  })

  it('sporna atrybucja zawsze tłumaczy, skąd się wzięła', () => {
    const zle = QUOTES.filter((q) => q.disputed && !q.source?.trim()).map((q) => q.id)
    expect(zle).toEqual([])
  })
})

describe('spójność autorów', () => {
  it('każdy autor należy do znanej epoki', () => {
    const zle = AUTHORS.filter((a) => !ERA_BY_ID[a.era]).map((a) => `${a.id} → ${a.era}`)
    expect(zle).toEqual([])
  })

  it('każdy autor ma rolę, kraj i biogram', () => {
    const zle = AUTHORS.filter((a) => !a.role || !a.country || !a.bio).map((a) => a.id)
    expect(zle).toEqual([])
  })

  it('biogram to pełny opis, nie jedno zdanie z rozpędu', () => {
    // Dwa zdania i ~150 znaków to próg, poniżej którego wpis znów robi się
    // notatką zamiast opisu — łatwo o to przy dopisywaniu nowych autorów.
    const zaKrotkie = AUTHORS.filter(
      (a) => a.bio.length < 150 || (a.bio.match(/[.!?]/g) ?? []).length < 2,
    ).map((a) => `${a.id} (${a.bio.length} zn.)`)
    expect(zaKrotkie).toEqual([])
  })

  it('daty życia są w sensownej kolejności', () => {
    const zle = AUTHORS.filter((a) => a.born && a.died && a.born > a.died).map((a) => a.id)
    expect(zle).toEqual([])
  })

  it('lifespan poprawnie zapisuje lata przed naszą erą', () => {
    expect(lifespan(AUTHOR_BY_ID['sokrates'])).toBe('470–399 p.n.e.')
    expect(lifespan(AUTHOR_BY_ID['seneka'])).toBe('4 p.n.e.–65 n.e.')
    expect(lifespan(AUTHOR_BY_ID['szekspir'])).toBe('1564–1616')
  })
})

describe('indeksy i statystyki', () => {
  it('lista autorów z cytatami zgadza się z zawartością bazy', () => {
    for (const a of AUTHORS_WITH_QUOTES) expect(quotesByAuthor(a.id).length).toBeGreaterThan(0)
  })

  it('każdy temat ma choć jeden cytat — inaczej ekran tematu jest pusty', () => {
    const puste = THEMES.filter((t) => quotesByTheme(t.id).length === 0).map((t) => t.id)
    expect(puste).toEqual([])
  })

  it('suma cytatów po tematach pokrywa całą bazę', () => {
    const objete = new Set(THEMES.flatMap((t) => quotesByTheme(t.id).map((q) => q.id)))
    expect(objete.size).toBe(QUOTES.length)
  })
})
