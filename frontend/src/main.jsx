import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk'
import { FlagProvider, UnleashClient } from '@unleash/proxy-client-react'
import { OpenFeatureProvider } from '@openfeature/react-sdk'
import { setupOpenFeature } from './openfeature.js'
import './index.css'
import App from './App.jsx'

const unleashConfig = {
  url: 'http://localhost:4242/api/frontend',
  clientKey: 'default:development.unleash-insecure-frontend-api-token',
  refreshInterval: 15,
  appName: 'nitte-merch-shop',
}

// Create Unleash client and expose flags globally for OpenFeature provider
const unleashClient = new UnleashClient(unleashConfig)
unleashClient.on('ready', () => {
  window.__unleashFlags = {
    'show-add-to-cart': unleashClient.isEnabled('show-add-to-cart'),
    'show-orders-page': unleashClient.isEnabled('show-orders-page'),
  }
})
unleashClient.start()

// Setup OpenFeature with Unleash as the provider
setupOpenFeature()

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
        <FlagProvider unleashClient={unleashClient}>
          <OpenFeatureProvider>
            <App />
          </OpenFeatureProvider>
        </FlagProvider>
      </LDProvider>
    </StrictMode>
  )
})()