/** Polska odmiana liczebników: 1 cytat, 2–4 cytaty, 5+ cytatów (z wyjątkiem 12–14). */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (n === 1) return one
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few
  return many
}

export const quoteCount = (n: number) => `${n} ${plural(n, 'cytat', 'cytaty', 'cytatów')}`
export const resultCount = (n: number) => `${n} ${plural(n, 'wynik', 'wyniki', 'wyników')}`
export const authorCount = (n: number) => `${n} ${plural(n, 'autor', 'autorów', 'autorów')}`
