import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()

/** Delikatna wibracja przy interakcji — cicho pomijana w przeglądarce. */
export async function tap(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
    await Haptics.impact({ style: map[style] })
  } catch {
    /* brak pluginu — ignorujemy */
  }
}

export async function shareText(title: string, text: string) {
  if (isNative) {
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title, text, dialogTitle: 'Udostępnij cytat' })
      return true
    } catch {
      return false
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, text })
      return true
    } catch {
      return false
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied' as const
  } catch {
    return false
  }
}

export async function initNativeShell() {
  if (!isNative) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setBackgroundColor({ color: '#0a0a0f' })
  } catch {
    /* ignorujemy */
  }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    /* ignorujemy */
  }
}

const DAILY_ID_BASE = 4200
/** Ile dni z góry planujemy — każdy dzień dostaje własny cytat. */
const DAILY_HORIZON = 30

/**
 * Ustawia (lub kasuje) powiadomienia z cytatem dnia.
 * Planujemy z góry `DAILY_HORIZON` dni, bo powtarzalne powiadomienie Androida
 * pokazywałoby w kółko ten sam tekst. Kolejka jest odświeżana przy starcie aplikacji.
 */
export async function syncDailyNotification(enabled: boolean, hour: number, minute: number) {
  if (!isNative) return { ok: false as const, reason: 'web' as const }
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')

    const pending = await LocalNotifications.getPending()
    const ours = pending.notifications.filter(
      (n) => n.id >= DAILY_ID_BASE && n.id < DAILY_ID_BASE + DAILY_HORIZON,
    )
    if (ours.length) await LocalNotifications.cancel({ notifications: ours })

    if (!enabled) return { ok: true as const, reason: 'off' as const }

    let perm = await LocalNotifications.checkPermissions()
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return { ok: false as const, reason: 'denied' as const }

    const { quoteOfTheDay } = await import('./daily')
    const { AUTHOR_BY_ID } = await import('@/data')

    const now = new Date()
    const notifications = []
    for (let i = 0; i < DAILY_HORIZON; i++) {
      const at = new Date(now)
      at.setDate(at.getDate() + i)
      at.setHours(hour, minute, 0, 0)
      if (at.getTime() <= now.getTime()) continue // dzisiejsza godzina już minęła

      const q = quoteOfTheDay(at)
      const author = AUTHOR_BY_ID[q.authorId]?.name ?? ''
      notifications.push({
        id: DAILY_ID_BASE + i,
        title: 'Cytat dnia',
        body: `„${q.pl}" — ${author}`,
        schedule: { at, allowWhileIdle: true },
        smallIcon: 'ic_stat_icon',
        extra: { quoteId: q.id },
      })
    }

    if (notifications.length) await LocalNotifications.schedule({ notifications })
    return { ok: true as const, reason: 'scheduled' as const, count: notifications.length }
  } catch (e) {
    console.warn('Nie udało się ustawić powiadomienia', e)
    return { ok: false as const, reason: 'error' as const }
  }
}
