import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Rejestrujemy ręcznie w main.tsx — tylko na webie. W WebView Capacitora
      // service worker serwowałby stary, zapisany bundle po każdej aktualizacji APK.
      injectRegister: false,
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
      manifest: {
        name: 'Sentencja — słynne cytaty',
        short_name: 'Sentencja',
        description: 'Kolekcja słynnych cytatów z podziałem na autorów, tematy i epoki.',
        lang: 'pl',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
  },
  test: {
    // Katalog e2e należy do Playwrighta — vitest nie potrafi go uruchomić
    // i bez tego ograniczenia wywracał się na jego plikach.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
