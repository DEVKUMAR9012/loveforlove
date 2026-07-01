import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // Fixes Firebase Google Auth popup being blocked in local development
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
})
