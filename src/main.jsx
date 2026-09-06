import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import { App } from './app/App.jsx'
import { initServiceWorker } from './pwa/registerServiceWorker.js'
import { initInstallPrompt } from './pwa/installPrompt.js'

initInstallPrompt()
initServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
