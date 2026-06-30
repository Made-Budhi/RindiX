import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '.ngrok-free.app'
    ]
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
})
