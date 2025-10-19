import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  plugins: [
    react(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: [
      '@shopify/shop-minis-react',
      'react',
      'react-dom'
    ],
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
  server: {
    port: 5173,
    host: true
  }
})
