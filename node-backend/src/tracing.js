import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace } from '@opentelemetry/api';

// Create OTLP HTTP exporter
const traceExporter = new OTLPTraceExporter({
  url: `http://${process.env.JAEGER_HOST || 'jaeger'}:4318/v1/traces`,
});

// Create SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'nitte-api-gateway',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start SDK
sdk.start();
console.log('✓ OpenTelemetry SDK started for nitte-api-gateway');
console.log(`✓ Tracing to Jaeger at ${process.env.JAEGER_HOST || 'jaeger'}:4318/v1/traces`);

// Get tracer
const tracer = trace.getTracer('nitte-api-gateway', '1.0.0');

export default tracer;
export { trace };
