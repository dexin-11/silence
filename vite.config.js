import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['audio/*.m4a'],
      manifest: {
        name: '三分钟静室',
        short_name: '静室',
        start_url: '/',
        display: 'standalone',
        background_color: '#F5F0EA',
        theme_color: '#F5F0EA',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,m4a,svg,png}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024
      }
    })
  ]
});
