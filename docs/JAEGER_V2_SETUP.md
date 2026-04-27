# Jaeger v2 Distributed Tracing Setup

> **Upgraded from Jaeger v1 to v2** - Jaeger v2 provides native OpenTelemetry (OTEL) support with modern Badger persistent storage, replacing the end-of-life Jaeger v1.x.

## Overview

**Jaeger v2** is the current, actively maintained version of Jaeger providing:
-  Native OpenTelemetry Protocol (OTLP) support
-  Modern Badger persistent storage backend
-  Backward compatibility with legacy Jaeger protocol (Thrift)
-  Unified UI for exploring distributed traces
-  Service topology discovery and latency analysis
-  Real-time metrics export to Prometheus

**Key Improvement:** Jaeger v2 uses native OTEL protocol as first-class support, making instrumentation with modern OTEL SDKs recommended for new deployments.

## Architecture

### Services Sending Traces

```
┌─────────────────────────────────────────────────────────────────┐
│                     Request Flow with Tracing                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Client Request                                               │
│  ┌──────────────────┐                                            │
│  │ React Frontend   │                                            │
│  │ (Port 5173)      │                                            │
│  └─────────┬────────┘                                            │
│            │                                                      │
│                                                                  │
│  2. API Gateway (Sends Spans)                                   │
│  ┌──────────────────────────────────┐                           │
│  │ Express.js API Gateway           │                           │
│  │ (Port 3000)                      │                           │
│  │ - Receives request                │                           │
│  │ - Creates root span              │                           │
│  │ - Sends span to Jaeger (UDP 6831)│                           │
│  │ - Forwards to Microservice       │                           │
│  └──────────────┬───────────────────┘                           │
│                 │                                                │
│                                                                 │
│  3. Python Microservice                                          │
│  ┌──────────────────────────────────┐                           │
│  │ FastAPI Service                  │                           │
│  │ (Port 8000)                      │                           │
│  │ - Creates child span             │                           │
│  │ - Calls database                 │                           │
│  └──────────────┬───────────────────┘                           │
│                 │                                                │
│                                                                 │
│  4. Database Layer                                              │
│  ┌──────────────────┐                                            │
│  │ MongoDB          │                                            │
│  │ (Port 27017)     │                                            │
│  └──────────────────┘                                            │
│                                                                   │
│   (All Spans Flow to)                                          │
│                                                                   │
│  Jaeger v2 Collector                                             │
│  ┌──────────────────────────────────┐                           │
│  │ Jaeger Agent/Collector           │                           │
│  │ (Port 6831 UDP - Thrift)        │                           │
│  │ (Port 4317 gRPC - OTEL)         │                           │
│  │ (Port 4318 HTTP - OTEL)         │                           │
│  │                                   │                           │
│  │ - Receives spans from services    │                           │
│  │ - Stores in Badger (/badger/*)   │                           │
│  │ - Exposes metrics to Prometheus   │                           │
│  └──────────────────────────────────┘                           │
│                                                                   │
│   (View Traces via)                                            │
│                                                                   │
│  Jaeger UI                                                       │
│  http://localhost:16686                                          │
│  - View all traces                                               │
│  - Service dependency graph                                      │
│  - Latency analysis                                              │
│  - Error tracking                                                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Jaeger v2 Configuration

### Docker Compose Setup (docker/docker-compose.yml)

```yaml
jaeger:
  image: jaegertracing/all-in-one:v2.1.0
  container_name: nitte-jaeger
  ports:
    # OTLP Receivers (Modern - Recommended)
    - "4317:4317"      # OTLP gRPC
    - "4318:4318"      # OTLP HTTP
    
    # Legacy Jaeger Protocol (Backward Compatibility)
    - "6831:6831/udp"  # Jaeger agent (Thrift compact)
    - "6832:6832/udp"  # Jaeger agent (Thrift binary)
    - "5778:5778"      # Jaeger agent (HTTP)
    
    # Collector APIs
    - "14268:14268"    # Jaeger collector (HTTP)
    - "14250:14250"    # Jaeger collector (gRPC)
    
    # UI and Metrics
    - "16686:16686"    # Jaeger UI
    - "14269:14269"    # Prometheus metrics scrape
    - "9411:9411"      # Zipkin compatible endpoint
    
  environment:
    # Storage Configuration
    JAEGER_STORAGE_TYPE: badger
    BADGER_SPAN_STORE_TTL: 168h           # 7-day retention
    JAEGER_BADGER_EPHEMERAL: "false"      # Persistent storage
    JAEGER_BADGER_DIRECTORY_VALUE: /badger/data
    JAEGER_BADGER_DIRECTORY_KEY: /badger/key
    
    # Logging
    JAEGER_LOG_LEVEL: info
    
    # OTEL Configuration
    OTEL_EXPORTER_OTLP_PROTOCOL: grpc
    
  volumes:
    - jaeger_data:/badger  # Persistent storage volume
```

### Environment Variables for Services

**Node.js Backend (node-backend/docker-compose):**
```env
JAEGER_AGENT_HOST: nitte-jaeger    # Docker container name
JAEGER_AGENT_PORT: 6831              # Thrift compact protocol
```

**Python Service (python-service/docker-compose):**
```env
JAEGER_AGENT_HOST: nitte-jaeger    # Docker container name
JAEGER_AGENT_PORT: 6831              # Thrift compact protocol
```

> **Note:** Services use legacy Thrift protocol for compatibility. To migrate to native OTEL:
> - Replace `jaeger-client` with `@opentelemetry/sdk-node` (Node.js)
> - Replace `jaeger-client` with `opentelemetry-api` (Python)
> - Update ports from 6831 to 4317 (gRPC) or 4318 (HTTP)

## Supported Protocols

### OpenTelemetry Protocol (OTLP) - Recommended

Modern standard for observability. Jaeger v2 has native OTLP support.

**OTLP gRPC:**
```
Host: localhost:4317
Protocol: gRPC
Format: Protocol Buffers
Bandwidth:  Smallest
Latency:  Lowest
```

**OTLP HTTP:**
```
Host: localhost:4318
Protocol: HTTP/1.1
Format: JSON or Protocol Buffers
Bandwidth: Medium
Latency:  Low
```

### Legacy Jaeger Protocol (Thrift) - Current Implementation

Backward compatible protocol. Currently used by Node.js API Gateway.

**Jaeger Thrift Compact:**
```
Host: localhost:6831
Protocol: UDP
Format: Thrift compact binary
Bandwidth:  Smallest
Latency:  Lowest
Reliability: ️ UDP (best effort)
```

**Jaeger Thrift Binary:**
```
Host: localhost:6832
Protocol: UDP
Format: Thrift binary
Bandwidth: Larger
Latency:  Low
Reliability: ️ UDP (best effort)
```

## Instrumentation

### Node.js Backend (Express.js)

**Current Setup:** Using `jaeger-client` library (v1 implementation)

**File:** [node-backend/src/tracing.js](../node-backend/src/tracing.js)

```javascript
const initTracer = (serviceName) => {
  const config = {
    serviceName,
    sampler: {
      type: 'const',
      param: 1,  // 100% sampling - all requests traced
    },
    reporter: {
      logSpans: true,
      agentHost: 'nitte-jaeger',  // Container name
      agentPort: 6831,             // Thrift compact
      maxPacketSize: 65000,
    },
  }
}
```

**Features:**
-  All requests sampled (100%)
-  Logs span reports to console
-  Tags with service metadata
-  Graceful shutdown with span flushing

**Middleware (node-backend/src/index.js):**
- Creates span per HTTP request
- Extracts trace context from headers
- Tags with HTTP method, URL, status code
- Automatically generates latency metrics

### Python Service (FastAPI)

**Current Status:** Jaeger instrumentation available but not enabled

**To Enable:**
1. Install `jaeger-client`: `pip install jaeger-client`
2. Add to `python-service/app/main.py`:
   ```python
   from jaeger_client import Config
   
   def init_jaeger_tracer(service_name):
       config = Config(
           config={
               'sampler': {'type': 'const', 'param': 1},
               'logging': True,
               'local_agent': {
                   'reporting_host': 'nitte-jaeger',
                   'reporting_port': 6831,
               }
           },
           service_name=service_name,
       )
       return config.initialize_tracer()
   
   tracer = init_jaeger_tracer('python-service')
   ```

## Accessing Jaeger

### Jaeger UI

**URL:** http://localhost:16686

**Features:**
1. **Service List** - All services reporting traces
2. **Trace Search**
   - Search by service name
   - Filter by operation
   - Query by tags or status
3. **Trace Details**
   - Timeline view with spans
   - Span duration color-coded
   - Service-to-service latency
4. **Metrics**
   - Average latency per operation
   - Error rates
   - Throughput (requests/sec)
5. **Service Dependencies**
   - Automatic topology discovery
   - Service interaction graph

### Expected Services

Once trace data flows:

```
Services Visible in Jaeger UI:
├── jaeger-all-in-one (Jaeger internal)
└── nitte-api-gateway (Node.js Express)
```

> **Note:** Python service only appears in traces after:
> 1. Jaeger instrumentation is enabled in `python-service/app/main.py`
> 2. Spans explicitly created and sent to Jaeger

## Generating Traces

### Method 1: User App (Frontend)

1. Open http://localhost:5173
2. Browse products
3. Place an order
4. Check Jaeger UI - should see traces from API Gateway

### Method 2: Admin Dashboard

1. Open http://localhost:5174 (Admin Dashboard)
2. Navigate to "Distributed Tracing" tab
3. View live trace data and service status
4. "Refresh" button to see latest traces

### Method 3: Direct API Calls

```bash
# Test product listing
curl -s http://localhost:3000/api/v1/products | jq

# Check health
curl -s http://localhost:3000/api/health | jq

# Each request generates a trace visible in Jaeger
```

## Storage

### Badger (Persistent Storage)

**Configuration Files:**
- Spans: `/badger/data/` (mounted to `jaeger_data` volume)
- Keys: `/badger/key/` (mounted to `jaeger_data` volume)

**TTL (Time-To-Live):** 168 hours (7 days)
- Traces older than 7 days automatically purged
- Storage is persistent across container restarts

**Size Management:**
```bash
# View Jaeger data volume
docker volume ls | grep jaeger

# Check volume contents
docker volume inspect nitte_jaeger_data

# Clean old traces (manual)
docker exec nitte-jaeger rm -rf /badger/data/*
```

## Metrics Export

### Prometheus Integration

Jaeger v2 exports its own metrics to Prometheus on port 14269.

**Prometheus Config** ([monitoring/prometheus-config.yml](../monitoring/prometheus-config.yml)):

```yaml
scrape_configs:
  - job_name: 'jaeger'
    static_configs:
      - targets: ['localhost:14269']
```

**Metrics available:**
- `jaeger_tracer_traces_started_total` - Total traces
- `jaeger_tracer_spans_dropped_total` - Dropped spans
- `jaeger_tracer_reporter_spans_sent_total` - Successfully sent spans
- `jaeger_ci_cache_xxx` - Cache performance metrics

## Troubleshooting

### Issue: No services in Jaeger UI

**Cause 1: No requests generated**
- Solution: Make API calls with `curl` or use the frontend app
  ```bash
  curl http://localhost:3000/api/v1/products
  ```

**Cause 2: Jaeger not receiving spans**
- Check Node Exporter logs:
  ```bash
  docker logs nitte-node-backend | grep -i reporting
  ```
- Expected output: `Reporting span...`

**Cause 3: Container connectivity issue**
- Verify `JAEGER_AGENT_HOST` is set to `nitte-jaeger` (exact container name)
- Check Docker network:
  ```bash
  docker network inspect docker_nitte-network
  ```

### Issue: Jaeger UI not loading

**Solution:**
- Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Check if Jaeger is running:
  ```bash
  curl http://localhost:16686/
  ```

### Issue: Poor trace data quality

**Cause: Low sampling rate**
- Currently set to 100% sampling (all requests traced)
- For production, consider reducing to 10%-20% to reduce load
- Edit [node-backend/src/tracing.js](../node-backend/src/tracing.js):
  ```javascript
  sampler: {
    type: 'probabilistic',
    param: 0.1,  // 10% of requests
  }
  ```

### Issue: High disk usage from traces

**Solution 1: Reduce TTL**
- Lower `BADGER_SPAN_STORE_TTL` from 168h to 24h or 72h
- Update in docker-compose.yml:
  ```yaml
  BADGER_SPAN_STORE_TTL: 24h
  ```

**Solution 2: Lower sampling rate**
- Reduce trace sampling as shown above
- Sample only critical operations

**Solution 3: Manual cleanup**
- Stop containers and clear volume:
  ```bash
  docker-compose down
  docker volume rm nitte_jaeger_data
  docker-compose up -d
  ```

## Migration from v1 to v2

### What Changed

| Feature | v1 | v2 |
|---------|----|----|
| Storage | Elasticsearch-only | Badger (recommended) |
| OTLP Support | Via plugin | Native |
| Protocol Support | Thrift only | Thrift + OTLP |
| Configuration | Consul integration | Environment variables |
| UI | ES-based | Modern OTEL-native |
| Performance | Moderate |  Improved |
| Maintenance Status |  EOL |  Active |

### Current Compatibility Status

** Working:**
- Node.js backend sends traces via Thrift (jaeger-client library)
- Traces visible in Jaeger v2 UI
- Storage using Badger
- Metrics export to Prometheus

**️ Partially Working:**
- Python service not yet instrumented

**Recommended Future Upgrade:**
- Replace `jaeger-client` with `@opentelemetry/sdk-node`
- Use native OTLP protocol (port 4317 or 4318)
- Benefits: Better performance, official support, modern standards

## Performance Tuning

### Optimize Span Reporter

```javascript
// Current (good for development)
reporter: {
  logSpans: true,
  agentHost: 'nitte-jaeger',
  agentPort: 6831,
  maxPacketSize: 65000,
}

// Production optimization
reporter: {
  logSpans: false,           // Disable console logging
  agentHost: 'nitte-jaeger',
  agentPort: 6831,
  maxPacketSize: 65000,
  bufferFlushInterval: 1000, // Flush every 1 second
}
```

### Adjust Batch Sizes

For high-traffic services, tune batch reporting:

```javascript
reporter: {
  agentHost: 'nitte-jaeger',
  agentPort: 6831,
  maxPacketSize: 65000,
  // New in production
  reportBatchSize: 5000,     // Batch report size
  reportLogicalBatch: false, // Wait for batch or time
}
```

## References

- **Jaeger Official Docs:** https://www.jaegertracing.io/docs/1.52/
- **OpenTelemetry:** https://opentelemetry.io/
- **Badger Storage:** https://github.com/dgraph-io/badger
- **Jaeger GitHub:** https://github.com/jaegertracing/jaeger

## Related Documentation

- [Admin Dashboard - Tracing Component](../admin-dashboard/src/components/Traces.jsx)
- [Node.js Instrumentation](../node-backend/src/tracing.js)
- [Monitoring Stack](docker-compose-monitoring.yml)
- [Main Docker Compose](docker/docker-compose.yml)
