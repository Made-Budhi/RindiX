import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(<App />)
}

// Register the service worker for installable-PWA behaviour (production only,
// so the dev server never serves stale assets).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
