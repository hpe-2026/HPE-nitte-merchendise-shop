import { OpenFeature } from '@openfeature/web-sdk'

class UnleashOpenFeatureProvider {
  metadata = { name: 'Unleash Provider' }

  async initialize() {}

  resolveBooleanEvaluation(flagKey, defaultValue) {
    const value = window.__unleashFlags?.[flagKey] ?? defaultValue
    return { value, reason: 'STATIC' }
  }

  resolveStringEvaluation(flagKey, defaultValue) {
    return { value: defaultValue, reason: 'STATIC' }
  }

  resolveNumberEvaluation(flagKey, defaultValue) {
    return { value: defaultValue, reason: 'STATIC' }
  }

  resolveObjectEvaluation(flagKey, defaultValue) {
    return { value: defaultValue, reason: 'STATIC' }
  }
}

export const setupOpenFeature = () => {
  OpenFeature.setProvider(new UnleashOpenFeatureProvider())
}

export { OpenFeature }