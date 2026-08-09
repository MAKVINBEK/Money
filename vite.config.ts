import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico',
        'logo.svg',
        'apple-touch-icon-180x180.png',
      ],

      manifest: {
        id: '/',
        name: 'Akcha — личные финансы',
        short_name: 'Akcha',
        description: 'Личный учёт доходов, расходов и бюджета — приватно и офлайн',

        lang: 'ru',
        start_url: '/',
        scope: '/',

        display: 'standalone',
        orientation: 'portrait-primary',

        background_color: '#F5F7FB',
        theme_color: '#4F46E5',

        categories: ['finance', 'utilities'],

        icons: [
          {
            src: '/pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // Public icons are already included above or referenced by the manifest.
        // Keeping the generated app shell here avoids duplicate precache entries.
        globPatterns: ['**/*.{js,css,html}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
