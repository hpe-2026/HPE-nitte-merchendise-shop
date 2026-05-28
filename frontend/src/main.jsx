import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk'
import './index.css'
import App from './App.jsx'

const context = {
  kind: 'user',
  key: 'anonymous',
  anonymous: true
}

;(async () => {
  const LDProvider = await asyncWithLDProvider({
    clientSideID: '6a184743fdd0390acf3e4c3e',
    context,
    options: { bootstrap: 'localStorage' }
  })

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <LDProvider>
        <App />
      </LDProvider>
    </StrictMode>
  )
})()