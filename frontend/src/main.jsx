import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FlagProvider, UnleashClient } from '@unleash/proxy-client-react'
import { OpenFeatureProvider } from '@openfeature/react-sdk'
import { setupOpenFeature } from './openfeature.js'
import { initFlagsmith } from './flagsmith.js'
import './index.css'
import App from './App.jsx'

const unleashClient = new UnleashClient({
  url: 'http://localhost:4242/api/frontend',
  clientKey: 'default:development.unleash-insecure-frontend-api-token',
  refreshInterval: 15,
  appName: 'nitte-merch-shop',
})
unleashClient.start()
setupOpenFeature()

;(async () => {
  await initFlagsmith()
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <FlagProvider unleashClient={unleashClient}>
        <OpenFeatureProvider>
          <App />
        </OpenFeatureProvider>
      </FlagProvider>
    </StrictMode>
  )
})()