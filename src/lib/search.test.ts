import { describe, expect, it } from 'vitest'
import { highlight, normalize, search } from './search'

describe('normalizacja tekstu', () => {
  it('usuwa polskie znaki diakrytyczne', () => {
    expect(normalize('Śpieszmy się kochać ludzi')).toBe('spieszmy sie kochac ludzi')
    expect(normalize('ŁÓDŹ')).toBe('lodz')
    expect(normalize('zażółć gęślą jaźń')).toBe('zazolc gesla jazn')
  })

  it('usuwa cudzysłowy i interpunkcję', () => {
    expect(normalize('„Wiem, że nic nie wiem."')).toBe('wiem ze nic nie wiem')
  })

  it('zachowuje znaki spoza alfabetu łacińskiego', () => {
    expect(normalize('πάντα ῥεῖ')).toContain('παντα')
  })
})

describe('wyszukiwanie', () => {
  it('znajduje cytat mimo braku polskich znaków w zapytaniu', () => {
    const hits = search('wolnosc')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => h.quote.pl.toLowerCase().includes('wolnoś'))).toBe(true)
  })

  it('znajduje po nazwisku autora', () => {
    const hits = search('Seneka')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((h) => h.quote.authorId === 'seneka')).toBe(true)
  })

  it('znajduje po treści oryginału', () => {
    const hits = search('carpe diem')
    expect(hits[0]?.quote.authorId).toBe('horacy')
  })

  it('wymaga wystąpienia wszystkich słów zapytania', () => {
    expect(search('seneka kwantowa')).toEqual([])
  })

  it('ignoruje zapytania krótsze niż dwa znaki', () => {
    expect(search('a')).toEqual([])
    expect(search('')).toEqual([])
  })

  it('szuka frazy dosłownie, gdy ujęto ją w cudzysłów', () => {
    const luzne = search('nic nie wiem')
    const fraza = search('"nic nie wiem"')
    expect(fraza.length).toBeGreaterThan(0)
    expect(fraza.length).toBeLessThanOrEqual(luzne.length)
    expect(fraza.every((h) => normalize(h.quote.pl + ' ' + (h.quote.original ?? '')).includes('nic nie wiem'))).toBe(true)
  })
})

describe('podświetlanie wyników', () => {
  it('zaznacza dopasowane słowa', () => {
    const segs = highlight('Wiem, że nic nie wiem.', 'wiem')
    expect(segs.some((s) => s.hit)).toBe(true)
    expect(segs.map((s) => s.s).join('')).toBe('Wiem, że nic nie wiem.')
  })

  it('działa mimo różnic w diakrytykach', () => {
    const segs = highlight('Wolność jest darem.', 'wolnosc')
    expect(segs.find((s) => s.hit)?.s).toContain('Wolność')
  })

  it('nie gubi ani nie duplikuje tekstu przy pustym zapytaniu', () => {
    const tekst = 'Chwytaj dzień.'
    expect(highlight(tekst, '').map((s) => s.s).join('')).toBe(tekst)
  })
})
