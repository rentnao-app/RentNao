import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_TARGET = 'http://localhost:3000'

const API_ROUTE_PREFIXES = [
  'health',
  'auth',
  'admin',
  'users',
  'properties',
  'wallet',
  'wishlists',
  'requests',
  'notifications',
  'testimonials',
  'conversations',
  'deals',
  'ws',
]

const devProxy = Object.fromEntries(
  API_ROUTE_PREFIXES.map((prefix) => [
    `/${prefix}`,
    {
      target: BACKEND_TARGET,
      changeOrigin: true,
      ws: prefix === 'ws',
    },
  ])
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: devProxy,
  },
})
