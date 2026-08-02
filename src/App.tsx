import { useEffect } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Aurora } from './components/Aurora'
import { Icon, type IconName } from './components/Icon'
import { useStore } from './lib/store'
import { isNative, syncDailyNotification, tap } from './lib/native'
import Home from './screens/Home'
import Explore from './screens/Explore'
import SearchScreen from './screens/SearchScreen'
import Library from './screens/Library'
import SettingsScreen from './screens/SettingsScreen'
import AuthorScreen from './screens/AuthorScreen'
import ThemeScreen from './screens/ThemeScreen'
import EraScreen from './screens/EraScreen'
import QuoteScreen from './screens/QuoteScreen'
import StudioScreen from './screens/StudioScreen'
import CollectionScreen from './screens/CollectionScreen'
import BrowseScreen from './screens/BrowseScreen'
import RandomScreen from './screens/RandomScreen'
import TimelineScreen from './screens/TimelineScreen'

/** Poza komponentem, żeby przetrwało przemontowanie w obrębie tego samego procesu. */
let adresStartowyZuzyty = false

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Start', icon: 'home' },
  { to: '/odkrywaj', label: 'Odkrywaj', icon: 'compass' },
  { to: '/losuj', label: 'Losuj', icon: 'dice' },
  { to: '/przegladaj', label: 'Talia', icon: 'sparkles' },
  { to: '/szukaj', label: 'Szukaj', icon: 'search' },
  { to: '/zbiory', label: 'Zbiory', icon: 'heart' },
]

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const themeMode = useStore((s) => s.settings.themeMode)
  const fontScale = useStore((s) => s.settings.fontScale)
  const daily = useStore((s) => s.settings.dailyEnabled)
  const dailyHour = useStore((s) => s.settings.dailyHour)
  const dailyMinute = useStore((s) => s.settings.dailyMinute)

  // Kolejka powiadomień obejmuje 30 dni — odświeżamy ją przy każdym starcie.
  useEffect(() => {
    if (isNative && daily) void syncDailyNotification(true, dailyHour, dailyMinute)
  }, [daily, dailyHour, dailyMinute])

  // Dotknięcie powiadomienia otwiera konkretny cytat.
  useEffect(() => {
    if (!isNative) return
    let remove: (() => void) | undefined
    import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
      LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
        const quoteId = event.notification.extra?.quoteId
        if (typeof quoteId === 'string') navigate(`/cytat/${quoteId}`)
      }).then((handle) => {
        remove = () => void handle.remove()
      })
    })
    return () => remove?.()
  }, [navigate])

  // Widget na ekranie głównym otwiera aplikację przez sentencja://cytat/<id>.
  useEffect(() => {
    if (!isNative) return
    let remove: (() => void) | undefined
    const otworz = (url?: string) => {
      const id = url?.match(/^sentencja:\/\/cytat\/([a-z0-9]+)/i)?.[1]
      if (id) navigate(`/cytat/${id}`)
    }
    import('@capacitor/app').then(({ App: CapApp }) => {
      // Adres startowy honorujemy dokładnie raz. System potrafi odtworzyć
      // aktywność z tym samym intentem, a wtedy aplikacja bez tej blokady
      // wracałaby w kółko do cytatu sprzed wielu dni.
      if (!adresStartowyZuzyty) {
        adresStartowyZuzyty = true
        void CapApp.getLaunchUrl().then((res) => otworz(res?.url))
      }
      CapApp.addListener('appUrlOpen', (event) => otworz(event.url)).then((handle) => {
        remove = () => void handle.remove()
      })
    })
    return () => remove?.()
  }, [navigate])

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
      const light = themeMode === 'light' || (themeMode === 'system' && prefersLight)
      root.classList.toggle('light', light)
      root.classList.toggle('dark', !light)
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', light ? '#fbfaf7' : '#08080c')
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    if (themeMode === 'system') {
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [themeMode])

  useEffect(() => {
    document.documentElement.style.fontSize = `${16 * fontScale}px`
  }, [fontScale])

  useEffect(() => {
    document.getElementById('scroll-root')?.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-dvh text-ink">
      <a
        href="#scroll-root"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium focus:text-black"
      >
        Przejdź do treści
      </a>
      <Aurora />

      <div className="mx-auto flex min-h-dvh w-full max-w-6xl overflow-x-hidden">
        <DesktopRail />

        {/* min-w-0 jest konieczne: bez niego poziome listy kafelków rozpychają
            ten element flex ponad szerokość ekranu (domyślne min-width: auto). */}
        <main
          id="scroll-root"
          tabIndex={-1}
          className="relative min-h-dvh w-full min-w-0 flex-1 pb-[calc(5.6rem+env(safe-area-inset-bottom))] outline-none md:pb-12"
        >
          {/* Klucz na ścieżce wymusza przemontowanie, więc każdy ekran wchodzi z animacją.
              Świadomie bez AnimatePresence — tryb „wait" wstrzymywał montowanie nowej trasy. */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/odkrywaj" element={<Explore />} />
              <Route path="/losuj" element={<RandomScreen />} />
              <Route path="/przegladaj" element={<BrowseScreen />} />
              <Route path="/szukaj" element={<SearchScreen />} />
              <Route path="/zbiory" element={<Library />} />
              <Route path="/zbiory/:id" element={<CollectionScreen />} />
              <Route path="/ustawienia" element={<SettingsScreen />} />
              <Route path="/autor/:id" element={<AuthorScreen />} />
              <Route path="/temat/:id" element={<ThemeScreen />} />
              <Route path="/epoka/:id" element={<EraScreen />} />
              <Route path="/os-czasu" element={<TimelineScreen />} />
              <Route path="/cytat/:id" element={<QuoteScreen />} />
              <Route path="/studio/:id" element={<StudioScreen />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </motion.div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}

function DesktopRail() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[15.5rem] shrink-0 flex-col gap-1 border-r border-line px-4 py-8 md:flex">
      <NavLink to="/" className="mb-8 flex items-center gap-3 px-3">
        <Mark />
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Sentencja</div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-faint">słynne cytaty</div>
        </div>
      </NavLink>

      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          className={({ isActive }) =>
            `press focus-ring flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] ${
              isActive ? 'glass font-medium text-ink' : 'text-muted hover:text-ink'
            }`
          }
        >
          <Icon name={n.icon} size={19} />
          {n.label}
        </NavLink>
      ))}

      <div className="mt-auto">
        <NavLink
          to="/ustawienia"
          className={({ isActive }) =>
            `press focus-ring flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[14px] ${
              isActive ? 'glass font-medium text-ink' : 'text-muted hover:text-ink'
            }`
          }
        >
          <Icon name="settings" size={19} />
          Ustawienia
        </NavLink>
      </div>
    </aside>
  )
}

function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] md:hidden">
      {/* wygaszenie treści przewijanej pod paskiem */}
      <div className="nav-scrim pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[7.5rem]" aria-hidden />
      <div className="nav-surface mx-auto flex max-w-md items-center justify-around rounded-[1.6rem] px-1.5 py-1.5 shadow-[var(--shadow)]">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            onClick={() => tap()}
            className="press focus-ring relative flex flex-1 flex-col items-center gap-0.5 rounded-3xl px-0.5 py-2"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-3xl bg-[color-mix(in_oklab,var(--accent)_22%,transparent)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={`relative ${isActive ? 'text-ink' : 'text-faint'}`}>
                  <Icon name={n.icon} size={19} />
                </span>
                <span
                  className={`relative text-[9.5px] leading-tight tracking-tight ${isActive ? 'text-ink' : 'text-faint'}`}
                >
                  {n.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function Mark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 text-white shadow-lg shadow-violet-900/30">
      <Icon name="quote" size={18} />
    </span>
  )
}
