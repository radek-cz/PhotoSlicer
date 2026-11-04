import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App/App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { LocalizationProvider } from './lib/i18n/components/LocalizationProvider/LocalizationProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LocalizationProvider>
        <App />
      </LocalizationProvider>
    </BrowserRouter>
  </StrictMode>,
)
