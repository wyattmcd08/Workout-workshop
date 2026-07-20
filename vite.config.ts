import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // autoUpdate keeps every client on the newest deploy without needing
      // a full app restart (prompt mode left stale clients stuck until the
      // PWA was force-closed — unreliable on iOS). The known cost — a live
      // page can lose its old precache mid-session and 404 a lazy chunk —
      // is handled by the vite:preloadError self-heal in main.tsx, so the
      // worst case is one automatic reload instead of a black screen.
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Dialed Dawg',
        short_name: 'Dialed Dawg',
        description: 'All-in-one fitness operating system',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        background_color: '#09090b',
        theme_color: '#09090b',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  define: {
    __BUILD_STAMP__: JSON.stringify(
      `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    ),
  },
  build: {
    target: 'es2020',
  },
})
