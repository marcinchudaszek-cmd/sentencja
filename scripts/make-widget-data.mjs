// Wyciąga z plików TS lekką listę cytatów dla natywnego widgetu Androida.
// Widget nie uruchamia WebView, więc potrzebuje własnej kopii danych — ale
// kolejność musi być identyczna jak w aplikacji, żeby cytat dnia się zgadzał.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PLIKI = ['antyk', 'klasyka', 'xix', 'xx'] // kolejność jak w src/data/index.ts

/** Zdejmuje apostrofy ucieczkowe z literału TS. */
const unescape = (s) => s.replace(/\\'/g, "'").replace(/\\\\/g, '\\')

function czytajAutorow() {
  const tekst = readFileSync(resolve(ROOT, 'src/data/authors.ts'), 'utf8')
  const mapa = new Map()
  for (const linia of tekst.split(/\r?\n/)) {
    const m = linia.match(/^\s*\['([a-z0-9-]+)',\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'/)
    if (m) mapa.set(m[1], { nazwa: unescape(m[2]), rola: unescape(m[3]) })
  }
  return mapa
}

function czytajCytaty(autorzy) {
  const out = []
  for (const plik of PLIKI) {
    const tekst = readFileSync(resolve(ROOT, `src/data/quotes-${plik}.ts`), 'utf8')
    for (const linia of tekst.split(/\r?\n/)) {
      const m = linia.match(
        /^\s*\['([a-d]\d{3})',\s*'((?:[^'\\]|\\.)*)',\s*'(?:(?:[^'\\]|\\.)*)',\s*'[a-z]*',\s*'([a-z0-9-]+)'/,
      )
      if (!m) continue
      const [, id, pl, authorId] = m
      const autor = autorzy.get(authorId)
      if (!autor) throw new Error(`Cytat ${id} wskazuje nieznanego autora „${authorId}"`)
      out.push({ id, t: unescape(pl), a: autor.nazwa })
    }
  }
  return out
}

const autorzy = czytajAutorow()
const cytaty = czytajCytaty(autorzy)

if (cytaty.length < 400) {
  throw new Error(`Wyekstrahowano tylko ${cytaty.length} cytatów — parser prawdopodobnie się rozjechał`)
}

const cel = resolve(ROOT, 'android/app/src/main/assets/quotes-widget.json')
if (!existsSync(dirname(cel))) mkdirSync(dirname(cel), { recursive: true })
writeFileSync(cel, JSON.stringify(cytaty))

console.log(`widget: zapisano ${cytaty.length} cytatów (${(JSON.stringify(cytaty).length / 1024).toFixed(0)} kB)`)
