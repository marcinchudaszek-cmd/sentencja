import type { Author, AuthorTuple } from './types'
import { AUTORZY_ANTYK } from './authors-antyk'
import { AUTORZY_SREDNIO_RENESANS } from './authors-srednio-renesans'
import { AUTORZY_OSWIECENIE } from './authors-oswiecenie'
import { AUTORZY_XIX } from './authors-xix'
import { AUTORZY_XX } from './authors-xx'
import { AUTORZY_WSPOLCZESNOSC } from './authors-wspolczesnosc'

/**
 * Autorzy trzymani w plikach per epoka — tak jak cytaty. Każdy wpis ma biogram
 * na dwa–trzy zdania: kim był, co zrobił i co z tego wynikło.
 */
const RAW: AuthorTuple[] = [
  ...AUTORZY_ANTYK,
  ...AUTORZY_SREDNIO_RENESANS,
  ...AUTORZY_OSWIECENIE,
  ...AUTORZY_XIX,
  ...AUTORZY_XX,
  ...AUTORZY_WSPOLCZESNOSC,
]

export const AUTHORS: Author[] = RAW.map(([id, name, role, era, country, born, died, bio]) => ({
  id,
  name,
  role,
  era,
  country,
  born: born || undefined,
  died: died || undefined,
  bio,
}))

export const AUTHOR_BY_ID = Object.fromEntries(AUTHORS.map((a) => [a.id, a])) as Record<string, Author>

/** Zapis lat życia w formie „470–399 p.n.e." */
export function lifespan(a: Author): string {
  if (!a.born && !a.died) return ''
  const bc = (n: number) => (n < 0 ? `${-n}` : `${n}`)
  const bornBC = a.born !== undefined && a.born < 0
  const diedBC = a.died !== undefined && a.died < 0
  if (a.born && !a.died) return `ur. ${bc(a.born)}${bornBC ? ' p.n.e.' : ''}`
  if (!a.born && a.died) return `zm. ${bc(a.died)}${diedBC ? ' p.n.e.' : ''}`
  const b = bc(a.born!)
  const d = bc(a.died!)
  if (bornBC && diedBC) return `${b}–${d} p.n.e.`
  if (bornBC && !diedBC) return `${b} p.n.e.–${d} n.e.`
  return `${b}–${d}`
}
