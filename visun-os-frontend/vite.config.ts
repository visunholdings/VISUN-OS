import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/visunai-logo.png'],
      manifest: {
        name: 'VISUN OS',
        short_name: 'VISUN OS',
        description: 'Điều hành công việc, khách hàng và cơ hội cho hoạt động AI Trainer.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F6F8FB',
        theme_color: '#206DC1',
        lang: 'vi',
        icons: [
          { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
