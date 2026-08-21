import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './spatial-index.css'
import App from './App.jsx'
import { PortalProvider } from './context/PortalContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PortalProvider>
      <App />
    </PortalProvider>
  </StrictMode>,
)
