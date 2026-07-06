/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base './' para poder servir la app desde cualquier subruta (GitHub Pages)
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // actualiza el shell sin tocar IndexedDB
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'KINEX',
        short_name: 'KINEX',
        description: 'Fuerza · control · movimiento',
        lang: 'es',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0c10',
        theme_color: '#0a0c10',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Con los WebP el sitio entero pesa ~2 MB: se precachea todo → offline completo.
        globPatterns: ['**/*.{js,css,html,webp,png,svg,ico}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
