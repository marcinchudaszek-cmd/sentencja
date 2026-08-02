import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import App from './App'
import './index.css'
import { initNativeShell, isNative } from './lib/native'

initNativeShell()

/**
 * Service worker ma sens tylko w przeglądarce. W aplikacji natywnej wszystkie
 * zasoby są w pakiecie APK, a zapisany cache SW przesłaniałby je po aktualizacji
 * — dlatego na Androidzie wyrejestrowujemy go i czyścimy pamięć podręczną.
 */
if (isNative) {
  void (async () => {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.()
      await Promise.all((regs ?? []).map((r) => r.unregister()))
      const keys = await caches?.keys?.()
      await Promise.all((keys ?? []).map((k) => caches.delete(k)))
    } catch {
      /* brak wsparcia — nic nie trzeba sprzątać */
    }
  })()
} else if ('serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* CSS wycisza własne animacje przy „ogranicz ruch", ale animacje Motion
        trzeba wyłączyć osobno — stąd reducedMotion="user". */}
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <App />
      </HashRouter>
    </MotionConfig>
  </StrictMode>,
)
