import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are served from this site (not Google Fonts), so visitors' browsers contact no one else.
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource-variable/newsreader/opsz.css'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
