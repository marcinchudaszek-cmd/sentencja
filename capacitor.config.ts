import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'pl.sentencja.app',
  appName: 'Sentencja',
  webDir: 'dist',
  android: {
    backgroundColor: '#0a0a0f',
    // Android 15+ wymusza edge-to-edge — bez tego WebView rysuje się pod
    // systemowym paskiem nawigacji i dolna nawigacja aplikacji ginie za nim.
    adjustMarginsForEdgeToEdge: 'force',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: '#0a0a0f',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#a78bfa',
    },
  },
}

export default config
