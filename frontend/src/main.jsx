import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk'
import { FlagProvider } from '@unleash/proxy-client-react'
import './index.css'
import App from './App.jsx'

const unleashConfig = {
  url: 'http://localhost:4242/api/frontend',
  clientKey: 'default:development.unleash-insecure-frontend-api-token',
  refreshInterval: 15,
  appName: 'nitte-merch-shop',
}

const ldContext = {
  kind: 'user',
  key: 'anonymous',
  anonymous: true
}

;(async () => {
  const LDProvider = await asyncWithLDProvider({
    clientSideID: '6a184743fdd0390acf3e4c3e',
    context: ldContext,
    options: { bootstrap: 'localStorage' }
  })

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <LDProvider>
        <FlagProvider config={unleashConfig}>
          <App />
        </FlagProvider>
      </LDProvider>
    </StrictMode>
  )
})()