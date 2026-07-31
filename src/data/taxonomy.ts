import type { Era, Theme } from './types'

export const ERAS: Era[] = [
  {
    id: 'antyk',
    name: 'Antyk',
    range: 'do 476 n.e.',
    blurb: 'Grecja, Rzym i Wschód — narodziny filozofii, retoryki i sztuki życia.',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
  },
  {
    id: 'sredniowiecze',
    name: 'Średniowiecze',
    range: '476 – 1450',
    blurb: 'Teologia, mistyka i poezja perska — myśl skupiona wokół wieczności.',
    gradient: 'from-indigo-400 via-violet-500 to-purple-700',
  },
  {
    id: 'renesans',
    name: 'Renesans',
    range: '1450 – 1650',
    blurb: 'Człowiek w centrum świata: humanizm, nauka i wielki teatr.',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-600',
  },
  {
    id: 'oswiecenie',
    name: 'Oświecenie',
    range: '1650 – 1800',
    blurb: 'Rozum, wolność i ironia — wiek filozofów i rewolucji.',
    gradient: 'from-sky-400 via-blue-500 to-indigo-600',
  },
  {
    id: 'xix',
    name: 'Wiek XIX',
    range: '1800 – 1900',
    blurb: 'Romantyzm, wielka powieść i pierwsze pęknięcia nowoczesności.',
    gradient: 'from-rose-400 via-pink-500 to-fuchsia-600',
  },
  {
    id: 'xx',
    name: 'Wiek XX',
    range: '1900 – 1990',
    blurb: 'Wojny, nauka i egzystencjalizm — najgęstsze stulecie w historii myśli.',
    gradient: 'from-lime-300 via-emerald-500 to-teal-700',
  },
  {
    id: 'wspolczesnosc',
    name: 'Współczesność',
    range: 'od 1990',
    blurb: 'Technologia, psychologia i nowe opowieści o człowieku.',
    gradient: 'from-violet-400 via-purple-500 to-indigo-700',
  },
]

export const THEMES: Theme[] = [
  { id: 'zycie', name: 'Życie', emoji: '🌱', blurb: 'Sztuka bycia i sens codzienności.', gradient: 'from-emerald-400 to-teal-600' },
  { id: 'madrosc', name: 'Mądrość', emoji: '🦉', blurb: 'Rozum, roztropność i granice wiedzy.', gradient: 'from-amber-300 to-orange-600' },
  { id: 'milosc', name: 'Miłość', emoji: '❤️‍🔥', blurb: 'Namiętność, czułość i przywiązanie.', gradient: 'from-rose-400 to-red-600' },
  { id: 'czas', name: 'Czas', emoji: '⏳', blurb: 'Przemijanie, chwila i pamięć.', gradient: 'from-sky-300 to-blue-600' },
  { id: 'szczescie', name: 'Szczęście', emoji: '☀️', blurb: 'Radość, spokój i to, czego naprawdę potrzeba.', gradient: 'from-yellow-300 to-amber-500' },
  { id: 'odwaga', name: 'Odwaga', emoji: '🔥', blurb: 'Męstwo, ryzyko i działanie mimo strachu.', gradient: 'from-orange-400 to-red-600' },
  { id: 'przyjazn', name: 'Przyjaźń', emoji: '🤝', blurb: 'Więź, lojalność i towarzystwo.', gradient: 'from-teal-300 to-cyan-600' },
  { id: 'smierc', name: 'Śmierć', emoji: '🕯️', blurb: 'Kres, żałoba i to, co po nas.', gradient: 'from-slate-400 to-slate-700' },
  { id: 'wolnosc', name: 'Wolność', emoji: '🕊️', blurb: 'Niezależność, wybór i opór.', gradient: 'from-cyan-300 to-blue-600' },
  { id: 'wiedza', name: 'Wiedza', emoji: '📚', blurb: 'Nauka, ciekawość i uczenie się.', gradient: 'from-indigo-300 to-violet-600' },
  { id: 'praca', name: 'Praca', emoji: '⚒️', blurb: 'Wysiłek, rzemiosło i wytrwałość.', gradient: 'from-stone-300 to-amber-700' },
  { id: 'sztuka', name: 'Sztuka', emoji: '🎭', blurb: 'Piękno, twórczość i wyobraźnia.', gradient: 'from-fuchsia-400 to-purple-600' },
  { id: 'natura', name: 'Natura', emoji: '🌊', blurb: 'Świat, żywioły i nasze w nim miejsce.', gradient: 'from-green-300 to-emerald-700' },
  { id: 'wladza', name: 'Władza', emoji: '👑', blurb: 'Polityka, rządzenie i wpływ.', gradient: 'from-yellow-400 to-yellow-700' },
  { id: 'cierpienie', name: 'Cierpienie', emoji: '🌧️', blurb: 'Ból, strata i to, czego uczy.', gradient: 'from-slate-300 to-indigo-700' },
  { id: 'nadzieja', name: 'Nadzieja', emoji: '✨', blurb: 'Wiara w jutro i siła oczekiwania.', gradient: 'from-amber-200 to-pink-500' },
  { id: 'prawda', name: 'Prawda', emoji: '🔎', blurb: 'Szczerość, złudzenia i poszukiwanie faktów.', gradient: 'from-blue-300 to-indigo-700' },
  { id: 'pieniadze', name: 'Pieniądze', emoji: '🪙', blurb: 'Bogactwo, chciwość i wartość rzeczy.', gradient: 'from-yellow-300 to-amber-600' },
  { id: 'zmiana', name: 'Zmiana', emoji: '🌀', blurb: 'Przemiana, kryzys i nowy początek.', gradient: 'from-violet-300 to-fuchsia-700' },
  { id: 'samotnosc', name: 'Samotność', emoji: '🌘', blurb: 'Bycie ze sobą, cisza i wyobcowanie.', gradient: 'from-slate-400 to-violet-800' },
  { id: 'humor', name: 'Humor', emoji: '🃏', blurb: 'Śmiech, ironia i dystans.', gradient: 'from-lime-300 to-emerald-600' },
  { id: 'sukces', name: 'Sukces', emoji: '🎯', blurb: 'Ambicja, porażka i droga na szczyt.', gradient: 'from-orange-300 to-rose-600' },
  { id: 'wojna', name: 'Wojna', emoji: '⚔️', blurb: 'Konflikt, pokój i cena zwycięstwa.', gradient: 'from-red-400 to-slate-800' },
  { id: 'wiara', name: 'Wiara', emoji: '🙏', blurb: 'Bóg, sens i duchowe poszukiwanie.', gradient: 'from-indigo-200 to-blue-700' },
  { id: 'slowo', name: 'Słowo', emoji: '✒️', blurb: 'Język, milczenie i siła wypowiedzi.', gradient: 'from-purple-300 to-indigo-600' },
  { id: 'czlowiek', name: 'Człowiek', emoji: '🧭', blurb: 'Natura ludzka, tożsamość i charakter.', gradient: 'from-cyan-200 to-teal-700' },
]

export const ERA_BY_ID = Object.fromEntries(ERAS.map((e) => [e.id, e])) as Record<string, Era>
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<string, Theme>
