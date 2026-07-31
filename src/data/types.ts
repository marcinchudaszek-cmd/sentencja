export type EraId =
  | 'antyk'
  | 'sredniowiecze'
  | 'renesans'
  | 'oswiecenie'
  | 'xix'
  | 'xx'
  | 'wspolczesnosc'

export type Lang = 'en' | 'la' | 'grc' | 'de' | 'fr' | 'it' | 'es' | 'ru' | 'pl' | 'ar' | 'fa' | 'zh' | 'sa' | 'pt'

export interface Era {
  id: EraId
  name: string
  range: string
  blurb: string
  gradient: string
}

export interface Theme {
  id: string
  name: string
  emoji: string
  blurb: string
  gradient: string
}

export interface Author {
  id: string
  name: string
  role: string
  era: EraId
  country: string
  /** rok urodzenia; wartości ujemne = p.n.e. */
  born?: number
  died?: number
  bio: string
}

export interface Quote {
  id: string
  /** wersja polska */
  pl: string
  /** oryginalne brzmienie, jeśli znane */
  original?: string
  lang?: Lang
  authorId: string
  themes: string[]
  source?: string
  /** atrybucja niepewna / powszechnie przypisywane */
  disputed?: boolean
}

export type QuoteTuple = [
  id: string,
  pl: string,
  original: string,
  lang: Lang | '',
  authorId: string,
  themes: string[],
  source?: string,
  disputed?: 1,
]

export type AuthorTuple = [
  id: string,
  name: string,
  role: string,
  era: EraId,
  country: string,
  born: number | 0,
  died: number | 0,
  bio: string,
]

export interface QuoteWithMeta extends Quote {
  author: Author
  era: Era
  themeList: Theme[]
}
