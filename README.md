# NITTE Merchandise Shop - Complete E-Commerce Microservices Platform

A **production-grade, full-stack microservices e-commerce platform** combining React frontends with a scalable backend architecture. Deploy once, run anywhere with Docker and Kubernetes support.

> ️ **IMPORTANT UPDATE:** Jaeger has been upgraded from v1 (EOL) to **v2.1.0** with native OpenTelemetry support and Badger persistent storage. After upgrading, please see [JAEGER_V2_DEPLOYMENT_TESTING.md](JAEGER_V2_DEPLOYMENT_TESTING.md) for deployment and testing instructions.

---

##  Quick Start (Choose Your Path)

### **First Time Setup?**
- **Linux/macOS**: Follow [SETUP_LINUX.md](SETUP_LINUX.md)
- **Windows**: Follow [SETUP_WINDOWS.md](SETUP_WINDOWS.md)

### **Already Set Up? Start Services:**
```bash
# Linux/macOS
./nitte-setup.sh start

# Windows
nitte-setup.bat start
```

---

## 📋 Table of Contents

- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Service Ports & URLs](#service-ports--urls)
- [How It Works (Low-Level)](#how-it-works-low-level)
- [MongoDB Distributed Tracing](#mongodb-distributed-tracing-with-jaeger)
- [Commands Reference](#commands-reference)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ System Architecture

### **High-Level Overview**

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSERS                         │
│  ┌──────────────────────┬──────────────────────────────────┐   │
│  │ User Frontend        │ Admin Dashboard                  │   │
│  │ React @ :5173        │ React @ :5174                    │   │
│  └──────────────────────┴──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
               HTTP/REST API -> CORS Enabled
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER (Port 3000)                │
│              Node.js Express.js with Middleware                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ • JWT Authentication & Authorization                   │   │
│  │ • Request Validation & Error Handling                 │   │
│  │ • CORS & Security Headers                             │   │
│  │ • Rate Limiting & Throttling                          │   │
│  │ • Prometheus Metrics (Counters, Gauges, Histograms)   │   │
│  │ • OpenTelemetry Tracing to Jaeger                     │   │
│  │ • Service-to-Service Internal Communication           │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
               Internal HTTP -> Service Discovery
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICE LAYER                            │
│         Python FastAPI Service (Port 8000)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ BUSINESS LOGIC IMPLEMENTATION                         │   │
│  │ • Product Management (CRUD operations)                │   │
│  │ • Order Processing & Fulfillment                     │   │
│  │ • Inventory Management & Stock Tracking              │   │
│  │ • User Profile Management                            │   │
│  │ • Data Validation & Constraints                      │   │
│  │ • Async/Concurrent Request Handling                 │   │
│  │ • Error Handling & Logging                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
               Database Queries -> Connection Pooling
┌─────────────────────────────────────────────────────────────────┐
│              DATA PERSISTENCE LAYER (Port 27017)                │
│                 MongoDB 7.0 NoSQL Database                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ DATABASE COLLECTIONS                                  │   │
│  │ • products   -> Product catalog (SKU, price, stock)   │   │
│  │ • orders     -> Order records (status, items, total)  │   │
│  │ • users      -> User accounts (auth, profile)         │   │
│  │                                                      │   │
│  │ DATABASE FEATURES                                    │   │
│  │ • Indexes: Fast queries on frequently sorted fields  │   │
│  │ • Sharding: Horizontal scalability for large data   │   │
│  │ • ACID Transactions: Data consistency guarantees    │   │
│  │ • Persistence: Data survives container restarts     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### **Observability Stack (Runs in Parallel)**

```
┌────────────────────────────────────────────────────┐
│         MONITORING & OBSERVABILITY LAYER           │
├────────────────────────────────────────────────────┤
│                                                    │
│ Prometheus (Port 9090)                            │
│ • Scrapes metrics from Node.js @ /metrics        │
│ • Scrapes metrics from Python @ :8000/metrics    │
│ • Stores time-series data in volumes             │
│ • 15-second scrape interval                      │
│ • Data retention: 30 days by default             │
│                                                    │
│ Grafana (Port 3001)                              │
│ • Visualizes Prometheus data                     │
│ • Real-time dashboards & alerts                  │
│ • Admin/admin123 credentials                    │
│ • Pre-configured Prometheus datasource           │
│                                                    │
│ Jaeger (Port 16686)                              │
│ • Receives OpenTelemetry traces from services   │
│ • Visualizes request flows across services      │
│ • Debug distributed requests                     │
│ • Storage: In-memory (can use Elasticsearch)    │
│                                                    │
│ AlertManager (Port 9093)                         │
│ • Deduplicates & routes alerts                   │
│ • Configured alert rules in Prometheus          │
│ • Integration points for email/Slack/PagerDuty   │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

### **Frontend**
| Technology | Use Case | Version |
|-----------|----------|---------|
| React | UI framework & component system | Latest |
| Vite | Fast build tool & dev server | 5.x |
| Tailwind CSS | Utility-first CSS framework | 3.x |
| Axios | HTTP client for API calls | Latest |

### **Backend API Gateway**
| Technology | Use Case | Version |
|-----------|----------|---------|
| Node.js | JavaScript runtime | 18+ |
| Express.js | HTTP server framework | 4.x |
| JWT | Stateless authentication | Via jwt library |
| OpenTelemetry | Distributed tracing | Latest |
| prom-client | Prometheus metrics | Latest |

### **Microservice**
| Technology | Use Case | Version |
|-----------|----------|---------|
| Python | Server-side language | 3.10+ |
| FastAPI | Web framework (async) | 0.100+ |
| Pydantic | Data validation | 2.x |
| Motor | Async MongoDB driver | Latest |
| SQLAlchemy | ORM patterns | 2.x |

### **Data Layer**
| Technology | Use Case | Version |
|-----------|----------|---------|
| MongoDB | NoSQL database | 7.0 |
| Docker Volumes | Data persistence | Native |

### **Observability**
| Technology | Use Case | Port | Version |
|-----------|----------|------|---------|
| Prometheus | Metrics collection | 9090 | Latest |
| Grafana | Metrics visualization | 3001 | Latest |
| Jaeger | Distributed tracing | 16686 | **v2.1.0** (OTEL Native)  |
| AlertManager | Alert management | 9093 | Latest |

> **Note:** Jaeger upgraded to v2.1.0 with native OpenTelemetry (OTEL) support and Badger persistent storage. See [JAEGER_V2_SETUP.md](docs/JAEGER_V2_SETUP.md) for details.

### **Infrastructure**
| Technology | Use Case |
|-----------|----------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Kubernetes YAML | Production deployment configs |
| Jenkins | CI/CD automation (optional) |

---

## 📁 Project Structure

```
nitte-task-2/
├── README.md                           ← Main documentation (you are here)
├── SETUP_LINUX.md                      ← Linux setup guide
├── SETUP_WINDOWS.md                    ← Windows setup guide
├── nitte-setup.sh                      ← Main setup script (Linux/macOS)
├── nitte-setup.bat                     ← Main setup script (Windows)
│
├── docker/                             ← Core services definition
│   ├── docker-compose.yml              ← Service orchestration
│   └── ...
│
├── monitoring/                         ← Observability stack
│   ├── docker-compose.yml              ← Monitoring services
│   ├── prometheus.yml                  ← Metrics collection config
│   ├── alertmanager.yml               ← Alert routing config
│   └── grafana/provisioning/           ← Dashboard configs
│
├── frontend/                           ← User-facing React app
│   ├── src/
│   │   ├── App.jsx                     ← Main component
│   │   ├── components/                 ← Reusable components
│   │   └── index.css                   ← Global styles
│   ├── package.json                    ← npm dependencies
│   └── vite.config.js                  ← Build configuration
│
├── admin-dashboard/                    ← Admin/monitoring React app
│   ├── src/
│   │   ├── App.jsx                     ← Admin app root
│   │   └── components/                 ← Admin components
│   ├── package.json                    ← npm dependencies
│   └── vite.config.js                  ← Build configuration
│
├── node-backend/                       ← API Gateway (Express.js)
│   ├── src/
│   │   ├── index.js                    ← Server entry point
│   │   ├── routes/                     ← API endpoints (REST)
│   │   ├── middleware/                 ← Auth, CORS, logging, metrics
│   │   ├── services/                   ← Business logic
│   │   └── config/                     ← Configuration files
│   ├── package.json                    ← npm dependencies
│   └── Dockerfile                      ← Container image definition
│
├── python-service/                     ← Business Logic (FastAPI)
│   ├── app/
│   │   ├── main.py                     ← FastAPI application setup
│   │   ├── routes/                     ← API endpoints
│   │   ├── models.py                   ← Pydantic schemas
│   │   ├── services/                   ← Business logic
│   │   └── db/                         ← Database connection
│   ├── requirements.txt                ← Python dependencies
│   └── Dockerfile                      ← Container image definition
│
├── database/                           ← Database initialization
│   └── init-scripts/
│       └── init.js                     ← MongoDB seed data
│
├── k8s/                                ← Kubernetes configs (production)
│   ├── namespace.yaml                  ← Kubernetes namespace
│   ├── deployment.yaml                 ← Service deployments
│   └── helm/                           ← Helm charts
│
└── jenkins/                            ← CI/CD pipeline (optional)
    ├── Jenkinsfile                     ← Pipeline stages
    ├── docker-compose-jenkins.yml      ← Jenkins setup
    └── scripts/                        ← Build/deploy scripts
```

---

## 🔌 Service Ports & URLs

### **Frontend Applications**

| Service | URL | Purpose |
|---------|-----|---------|
| User Frontend | http://localhost:5173 | Shopping application |
| Admin Dashboard | http://localhost:5174 | Monitoring & management |

### **Backend APIs**

| Service | URL | Purpose |
|---------|-----|---------|
| API Gateway (Node.js) | http://localhost:3000 | Main API entry point |
| Health Check | http://localhost:3000/api/v1/health | Service status |
| Products | http://localhost:3000/api/v1/products | Product listing |
| Orders | http://localhost:3000/api/v1/orders | Order management |
| Metrics Proxy | http://localhost:3000/api/v1/metrics/dashboard | Grafana proxy |
| Python Service (internal) | http://localhost:8000 | Business logic service |

### **Data Layer**

| Service | Connection | Purpose |
|---------|-----------|---------|
| MongoDB | localhost:27017 | Document database |
| Auth | admin / password | Database credentials |

### **Observability**

| Service | URL | Purpose |
|---------|-----|---------|
| Prometheus | http://localhost:9090 | Metrics UI & API |
| Grafana | http://localhost:3001 | Graphs & dashboards (admin/admin123) |
| Jaeger | http://localhost:16686 | Distributed tracing & analysis |
| AlertManager | http://localhost:9093 | Alert management |

---

##  How It Works (Low-Level)

### **Request Flow: User Places an Order**

```
1. USER BROWSER INTERACTION
   └─> Click "Place Order" button
       └─> React component sends HTTP POST request

2. HTTP REQUEST SENT
   └─> POST http://localhost:5173/api/v1/orders
       └─> Browser enforces CORS -> Routes to localhost:3000

3. NODE.JS API GATEWAY (Port 3000)
   ├─> Express receives request at TCP port 3000
   ├─> CORS middleware validates origin
   ├─> Logging middleware logs: "POST /api/v1/orders"
   ├─> JWT middleware extracts & validates auth token
   ├─> Rate limiting middleware checks request count
   ├─> Request validation middleware checks payload schema
   ├─> Prometheus middleware increments: http_requests_total
   ├─> OpenTelemetry starts span: "POST /api/v1/orders"
   │
   ├─> Routes request to Python service via HTTP:
   │   └─> POST http://python-service:8000/orders
   │       ├─> Docker DNS resolves "python-service" -> container IP
   │       ├─> OpenTelemetry starts span: "call_python_service"
   │       ├─> HTTP request sent over bridge network
   │       └─> Waits for response
   │
   └─> Response returns

4. PYTHON FASTAPI MICROSERVICE (Port 8000)
   ├─> FastAPI receives request
   ├─> Router matches POST /orders endpoint
   ├─> Pydantic validates request body schema
   ├─> Business logic processes:
   │   ├─> Check inventory availability  
   │   ├─> Calculate totals & taxes
   │   ├─> Validate address information
   │   └─> OpenTelemetry span: "validate_order"
   │
   ├─> Database transaction starts:
   │   └─> Motor (async MongoDB driver) connects to:
   │       └─> mongodb://admin:password@mongodb:27017
   │           ├─> Connection pooling: max 50 concurrent
   │           ├─> Docker bridge network used for connection
   │           ├─> Write prepared as BSON document
   │           ├─> db.orders.insertOne(order_doc)
   │           ├─> MongoDB writes to journal first
   │           ├─> Data persisted to: /data/db volume
   │           ├─> Update indexes
   │           └─> Returns inserted document ID
   │
   └─> Response sent back to Node.js

5. NODE.JS COMPLETES REQUEST
   ├─> Receives Python response
   ├─> Validates response format
   ├─> OpenTelemetry closes span: "call_python_service"
   ├─> Prometheus records: request_duration_seconds histogram
   ├─> Sets response headers (Content-Type, etc)
   ├─> Sends JSON response (HTTP 201) to browser
   └─> OpenTelemetry closes span: "POST /api/v1/orders"

6. MONITORING IN BACKGROUND (Simultaneous - No Impact on Request)
   ├─> Prometheus (Port 9090)
   │   └─> Every 15 seconds: Scrapes metrics endpoint
   │       ├─> GET http://localhost:3000/metrics
   │       ├─> GET http://localhost:8000/metrics
   │       ├─> Stores time-series: request_count, latency, errors
   │       ├─> Written to: /prometheus volume
   │       └─> Queryable for dashboards
   │
   ├─> Jaeger (Port 16686)
   │   ├─> Receives spans via UDP from both services
   │   ├─> Correlates by trace_id: "abc123..."
   │   ├─> Groups spans showing complete flow:
   │   │   ├─> Node.js span: 50ms
   │   │   ├─> Python span: 30ms
   │   │   ├─> MongoDB span: 10ms
   │   │   └─> Total: ~90ms end-to-end
   │   └─> Stored in memory (queryable in UI)
   │
   ├─> Grafana (Port 3001)
   │   ├─> Queries Prometheus every 30 seconds
   │   ├─> Renders graphs in Admin Dashboard
   │   └─> Shows real-time metrics:
   │       ├─> Request volume (requests/sec)
   │       ├─> Error rate percentage
   │       ├─> Latency percentiles (p50, p95, p99)
   │       └─> Service status
   │
   └─> AlertManager (Port 9093)
       ├─> Receives alerts from Prometheus rules
       ├─> Alert rule example: if (error_rate > 5%)
       ├─> Deduplicates identical alerts
       └─> Sends to configured channels (email, Slack, etc)

7. BROWSER DISPLAYS RESPONSE
   ├─> React receives HTTP 201 + order details
   ├─> Updates local state: orders = [...previous, new_order]
   ├─> Re-renders UI: show confirmation modal
   ├─> Clears cart from state
   └─> Navigates to Orders page
```

### **Container Network Communication**

```
Docker Network: "nitte-network" (User-defined bridge network)

Inside containers (using Docker DNS):
• nitte-node-backend:3000 -> http://python-service:8000
  └─> Docker DNS: python-service -> 172.18.0.3
  
• nitte-python-service:8000 -> mongodb://mongodb:27017
  └─> Docker DNS: mongodb -> 172.18.0.2
  
• nitte-prometheus:9090 scrapes http://node-backend:3000/metrics
  └─> Docker DNS: node-backend -> 172.18.0.4
  └─> No port forwarding: direct internal communication

Host machine (localhost):
• Browser -> http://localhost:3000 
  └─> Docker ports: {host_port}:{container_port} = 3000:3000
  
• Browser -> http://localhost:8000
  └─> Docker ports: {host_port}:{container_port} = 8000:8000
  
• Browser -> http://localhost:27017
  └─> Docker ports: {host_port}:{container_port} = 27017:27017
```

### **Data Persistence**

```
Docker Volumes (Data survives container restarts):

1. mongodb_data volume
   ├─> Host path: /var/lib/docker/volumes/nitte-task-2_mongodb_data/_data/
   ├─> Container path: /data/db (inside mongo container)
   ├─> Contains: Binary MongoDB files, indexes, WAL (write-ahead log)
   └─> Size: Grows with data (~100MB+)

2. prometheus_data volume
   ├─> Host path: /var/lib/docker/volumes/nitte-task-2_prometheus_data/_data/
   ├─> Container path: /prometheus (inside prometheus container)
   ├─> Contains: Time-series database files
   └─> Size: Grows with metric scrapes (~50MB per month)

3. grafana_data volume
   ├─> Host path: /var/lib/docker/volumes/nitte-task-2_grafana_data/_data/
   ├─> Container path: /var/lib/grafana (inside grafana container)
   ├─> Contains: Dashboards, users, configurations
   └─> Persistence: Custom dashboards survive restarts

Lifecycle:
• "docker compose down" -> Containers stop, volumes PERSIST (not deleted)
• "docker compose up"   -> New containers mount existing volumes
• "docker volume rm X"  -> Delete volume (destructive!)
• "docker volume inspect X" -> See volume details
```

### **Image Caching & Smart Rebuilding**

```
FIRST RUN (Fresh Clone):
  ./nitte-setup.sh setup
  ├─> Check if docker images exist (nitte_node-backend, nitte_python-service)
  ├─> Images DON'T exist
  ├─> Executes: docker compose build --no-cache
  │   ├─> Reads Dockerfile for each service
  │   ├─> Downloads base images (node:18, python:3.10, mongo:7.0)
  │   ├─> Runs build commands (npm install, pip install)
  │   ├─> Creates image layers (stored in /var/lib/docker/images/)
  │   ├─> Caches layers for future builds
  │   └─> Final size: ~2-3 GB total
  └─> Time: 15-30 MINUTES (slow - includes network downloads)

SECOND RUN (Today's Development):
  ./nitte-setup.sh start
  ├─> Check docker images (nitte_node-backend, nitte_python-service)
  ├─> Images EXIST in local cache
  ├─> Skips build entirely
  ├─> Just: docker compose up -d
  └─> Time: 5-10 SECONDS (fast!)

CODE CHANGE (You edited node-backend/src/index.js):
  ./nitte-setup.sh restart
  ├─> Detects Dockerfile or code changed
  ├─> Rebuilds ONLY affected image (node-backend)
  ├─> Other images use cached layers
  └─> Time: 30-60 SECONDS

DEPENDENCY CHANGE (Updated package.json):
  ./nitte-setup.sh rebuild
  ├─> Force rebuild all images (skip cache)
  ├─> docker compose build --no-cache
  └─> Time: 15-30 MINUTES (full rebuild)
```

---

## � MongoDB Distributed Tracing with Jaeger

### **Overview**

All MongoDB operations are automatically traced using **OpenTelemetry** and reported to **Jaeger**. This allows you to see the complete request flow from HTTP request -> FastAPI -> MongoDB queries.

### **What Gets Traced**

- `mongodb.connect` - Connection establishment to MongoDB
- `mongodb.find` - Query operations (SELECT-like)
- `mongodb.insert` - Create operations (INSERT)
- `mongodb.update` - Update operations (UPDATE)
- `mongodb.delete` - Delete operations (DELETE)
- `mongodb.create_indexes` - Index creation during startup
- `http.*` - HTTP endpoints (automatically)
- `fastapi.*` - FastAPI route handlers (automatically)

### **How to View Traces**

1. **Open Jaeger UI**: http://localhost:16686
2. **Select Service**: Choose `nitte-python-service` from dropdown
3. **View Operations**: See all MongoDB operations with timing details
4. **Inspect Traces**: Click any trace to see:
   - Full request flow from API Gateway -> FastAPI -> MongoDB
   - Latency breakdown for each component
   - MongoDB query details and attributes
   - Error details (if any)

### **Example Trace Flow**

```
POST /api/v1/orders
│
├─ REST API Request -> Node.js (Port 3000)
│  ├─ Span: "POST /api/v1/orders" - ~10ms
│  ├─ Span: "JaegerMiddleware" - ~2ms
│  └─ Forward to Python Service
│
├─ FastAPI Handler -> Python Service (Port 8000)
│  ├─ Span: "POST /api/orders" - ~45ms
│  ├─ Span: "validate_order" - ~3ms
│  ├─ Span: "check_inventory" - ~2ms
│  └─ Database Query
│
└─ MongoDB Operation -> Database (Port 27017)
   ├─ Span: "mongodb.find" (inventory) - ~8ms
   ├─ Span: "mongodb.update" (products) - ~10ms
   ├─ Span: "mongodb.insert" (orders) - ~15ms
   └─ Total DB Time: ~33ms

Total Request Latency: ~250-300ms
```

### **Key Metrics Available in Traces**

| Attribute | Example Value | Purpose |
|-----------|---|---|
| `mongodb.collection` | "orders" | Which collection |
| `mongodb.operation` | "insert" | Operation type |
| `mongodb.query` | `{_id: ObjectId()}` | Query parameters (truncated) |
| `http.status_code` | 201 | HTTP response code |
| `http.method` | POST | HTTP method |
| `span.duration_ms` | 45 | Time in milliseconds |

### **Configuration Details**

The tracing system uses:
- **OpenTelemetry SDK v1.21.0** - Standard tracing framework
- **Jaeger Exporter** - Sends spans to Jaeger via Thrift protocol
- **PyMongo Instrumentation** - Auto-catches MongoDB operations
- **FastAPI Instrumentation** - Auto-catches HTTP endpoints
- **Badger Persistent Storage** - Traces survive container restarts

### **Environment Variables**

```bash
JAEGER_AGENT_HOST=nitte-jaeger        # Jaeger container hostname
JAEGER_AGENT_PORT=6831                # Jaeger agent port (Thrift)
OTEL_TRACES_EXPORTER=otlp             # Use OpenTelemetry Protocol
OTEL_EXPORTER_OTLP_PROTOCOL=grpc      # Communication protocol
```

### **Debugging MongoDB Performance**

1. **Slow Query Detection**:
   - Open Jaeger UI
   - Filter traces by duration: Enter min/max time
   - Find spans with `mongodb.operation` attribute > 50ms

2. **Find Connection Issues**:
   - Search for traces with errors
   - Look for failed `mongodb.connect` spans
   - Check logs: `docker logs nitte-python-service`

3. **Track Query Patterns**:
   - Use trace search filters: Tag `mongodb.collection=orders`
   - See how often each collection is queried
   - Correlate with application load

### **Persistence**

- **Trace Data Storage**: Badger DB in `/badger/data` volume
- **Retention**: Default 72 hours (configurable)
- **Survives Restarts**: Yes - data persists in named volume
- **Clear Traces**: `docker volume rm nitte-task-2_jaeger_data`

---

## �📝 Commands Reference

### **Linux/macOS**

```bash
# First-time setup (builds images, starts services)
./nitte-setup.sh setup

# Start already-built services (fast, ~5 seconds)
./nitte-setup.sh start

# Stop all services (preserves data in volumes)
./nitte-setup.sh stop

# Restart services (stop + start)
./nitte-setup.sh restart

# Check service status
./nitte-setup.sh status

# View logs from all services
./nitte-setup.sh logs

# View logs from specific service
./nitte-setup.sh logs node-backend

# Rebuild images and clear cache
./nitte-setup.sh rebuild

# Clean up (removes containers, keeps data volumes)
./nitte-setup.sh clean
```

### **Windows**

```batch
# First-time setup (builds images, starts services)
nitte-setup.bat setup

# Start already-built services (fast, ~5 seconds)
nitte-setup.bat start

# Stop all services (preserves data in volumes)
nitte-setup.bat stop

# Restart services (stop + start)
nitte-setup.bat restart

# Check service status
nitte-setup.bat status

# View logs from all services
nitte-setup.bat logs

# Rebuild images and clear cache
nitte-setup.bat rebuild

# Clean up (removes containers, keeps data volumes)
nitte-setup.bat clean
```

---

## 🐛 Troubleshooting

### **Services Won't Start**

**Problem**: Docker containers fail to start
```bash
# Check what's running
docker ps -a

# View error logs
docker logs nitte-node-backend
docker logs nitte-python-service
docker logs nitte-mongodb

# Restart everything fresh
./nitte-setup.sh clean
./nitte-setup.sh setup
```

### **Ports Already in Use**

**Problem**: Error "Address already in use"
```bash
# Find what's using the port (Linux/macOS)
lsof -i :3000
lsof -i :5173

# Kill the process
kill -9 <PID>

# On Windows, use:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### **MongoDB Connection Fails**

**Problem**: "Unable to connect to MongoDB"
```bash
# Check if MongoDB container is healthy
docker ps | grep mongodb
docker logs nitte-mongodb

# Test connection
docker exec nitte-mongodb mongosh --eval "db.adminCommand('ping')"
```

### **Frontend Can't Reach API**

**Problem**: CORS error or "connection refused"
```
Solutions:
1. Check API is running: curl http://localhost:3000/api/v1/health
2. Browser console shows blocked request?
   └─> Check CORS_ORIGIN in docker-compose.yml
3. Using 127.0.0.1? Try localhost (or vice versa)
4. On Windows: Check Windows Firewall allows port 3000
5. On Mac: Check System Preferences -> Security & Privacy
```

### **Prometheus Metrics Missing**

**Problem**: Dashboards show empty/no data
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify services expose /metrics endpoint
curl http://localhost:3000/metrics
curl http://localhost:8000/metrics

# Check prometheus.yml configuration
cat monitoring/prometheus.yml

# Restart Prometheus
docker restart nitte-prometheus
```

### **Performance Issues**

**Problem**: Slow requests or high CPU
```bash
# Check container resource usage
docker stats

# View service logs for errors
docker logs nitte-python-service --tail=100

# Check database performance
docker exec nitte-mongodb mongosh --eval "db.orders.stats()"

# Monitor in Grafana: look for high latency spikes
# URL: http://localhost:3001
```

---

## 📚 Additional Resources

- **API Documentation**: http://localhost:3000 (OpenAPI/Swagger)
- **Metrics Dashboard**: http://localhost:3001 (Grafana, user/admin123)
- **Trace Analysis**: http://localhost:16686 (Jaeger)
- **Database Admin**: Use MongoDB Compass to connect to localhost:27017
- **Prometheus UI**: http://localhost:9090

---

##  Next Steps

1.  Read this README to understand the full architecture
2.  Follow [SETUP_LINUX.md](SETUP_LINUX.md) or [SETUP_WINDOWS.md](SETUP_WINDOWS.md)
3.  Run: `./nitte-setup.sh setup` (or `.bat setup` on Windows)
4.  Open http://localhost:5173 in your browser
5.  Explore all dashboards

---

**Ready to get started?** Pick your OS setup guide above! 

### System Layers

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│  ┌──────────────────────────┬──────────────────────────┐   │
│  │  User Frontend (React)   │  Admin Dashboard (React) │   │
│  │  http://localhost:5173   │  http://localhost:5174   │   │
│  └──────────────────────────┴──────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                            HTTP/REST API
┌────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                         │
│            Node.js Express (Port 3000)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • JWT Authentication & Session Management          │   │
│  │ • Request Validation & Error Handling              │   │
│  │ • CORS & Security Middleware                       │   │
│  │ • Rate Limiting & Performance Monitoring           │   │
│  │ • Service-to-Service Communication                 │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
                            Internal HTTP
┌────────────────────────────────────────────────────────────┐
│               SERVICE LAYER                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Python FastAPI Microservice (Port 8000)             │  │
│  │ ┌────────────────────────────────────────────────┐  │  │
│  │ │ • Product Management (CRUD)                    │  │  │
│  │ │ • Order Processing & Fulfillment               │  │  │
│  │ │ • Inventory Management                         │  │  │
│  │ │ • Data Validation & Business Logic             │  │  │
│  │ │ • Async/Await for High Concurrency             │  │  │
│  │ └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                            Database Query
┌────────────────────────────────────────────────────────────┐
│              DATA PERSISTENCE LAYER                         │
│        MongoDB (Port 27017)                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Collections:                                         │  │
│  │ • products    - Product catalog with metadata      │  │
│  │ • orders      - Customer orders with status        │  │
│  │ • users       - User accounts & authentication     │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ Features:                                           │  │
│  │ • Indexes for fast queries                         │  │
│  │ • Sharding support for scalability                 │  │
│  │ • ACID transactions                                │  │
│  │ • Persistence with volumes                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Technology Stack Deep Dive

#### **Frontend Layer (http://localhost:5173 & 5174)**

**User Frontend (React App)**
```javascript
// Entry: frontend/src/main.jsx
import React from 'react'
import App from './App.jsx'  // Main app component

// Features:
App.jsx
├── ProductList.jsx      // Browse catalog (GET /api/products)
├── Cart.jsx             // Shopping cart management
├── Orders.jsx           // Order history & tracking (GET /api/orders)
├── Navbar.jsx           // Navigation & API status
└── Styling (Tailwind CSS)

// HTTP Calls:
GET /api/products       -> Fetch product catalog
POST /api/orders        -> Place new order
GET /api/orders         -> Fetch user's orders
```

**Admin Dashboard (React App)**
```javascript
// Entry: admin-dashboard/src/main.jsx
import React from 'react'
import App from './App.jsx'  // Admin controller

// Features:
App.jsx
├── Dashboard.jsx        // Stats & real-time data (GET /api/stats)
├── Metrics.jsx          // Prometheus integration (GET /prometheus)
├── Traces.jsx           // Jaeger tracing (GET /jaeger)
├── JenkinsPipeline.jsx  // CI/CD status (GET /jenkins)
├── Products.jsx         // Product CRUD
│   ├── GET /api/products
│   ├── POST /api/products
│   ├── PUT /api/products/:id
│   └── DELETE /api/products/:id
├── Orders.jsx           // Order management
│   ├── GET /api/orders
│   └── PUT /api/orders/:id
└── AdminNavbar.jsx      // Navigation & status

// External Links:
Prometheus UI       ->  :9090
Jaeger UI          ->  :16686
Jenkins UI         ->  :8080
```

#### **API Gateway Layer (Node.js, Port 3000)**

```javascript
// Entry: node-backend/src/index.js
const express = require('express')
const authMiddleware = require('./middleware')
const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/products')
const orderRoutes = require('./routes/orders')

const app = express()

// Middleware Stack:
app.use(express.json())                    // Parse JSON
app.use(corsMiddleware)                    // CORS headers
app.use(securityHeaders)                   // Security headers
app.use(authMiddleware)                    // JWT validation
app.use(prometheusMetrics)                 // Metrics collection

// Routes:
POST   /api/auth/signup                    // Create account
POST   /api/auth/login                     // Authentication
POST   /api/auth/refresh                   // Token refresh
GET    /api/products                       // List products
POST   /api/products                       // Create product
PUT    /api/products/:id                   // Update product
DELETE /api/products/:id                   // Delete product
GET    /api/orders                         // List orders
POST   /api/orders                         // Create order
PUT    /api/orders/:id                     // Update order
GET    /api/health                         // Health check
GET    /api/stats                          // Statistics

// Deep Inside:
Each route handler:
1. Validates request data
2. Checks authentication (JWT)
3. Logs to Prometheus (metrics)
4. Calls Python service (internal HTTP)
5. Returns JSON response
```

**Request Flow Example:**
```
User clicks "Place Order" in React UI
               
POST /api/orders {customer, items, total}
               
Node.js API Gateway receives request
├─ Validate JSON schema
├─ Extract JWT token from header
├─ Check user permissions
├─ Log to Prometheus (http_requests_total++)
               
Forward to Python Service (internal TCP)
POST http://localhost:8000/api/orders
               
Python service receives:
├─ FastAPI Route Handler
├─ Pydantic model validation
├─ Business logic (calculate tax, check inventory)
├─ Database transaction begins
               
MongoDB: db.orders.insertOne({order_doc})
               
Returns to Python:
{orderId: "...", status: "pending", ...}
               
Python returns to Node.js
               
Node.js returns to Browser:
HTTP 201 Created + order details
               
React updates UI:
├─ Show confirmation modal
├─ Clear cart state
├─ Fetch updated orders list
└─ Redirect to Orders page

TOTAL TIME: ~300-500ms from click to confirmation
```

#### **Microservice Layer (Python FastAPI, Port 8000)**

```python
# Entry: python-service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import products, orders

app = FastAPI()

# Add middleware
app.add_middleware(CORSMiddleware, ...)  # Allow cross-origin

# Include routers (internal endpoints only)
app.include_router(products.router)
app.include_router(orders.router)

# Endpoints (only called by Node.js):
GET    /api/products           # List all products
POST   /api/products           # Create product
PUT    /api/products/{id}      # Update product
DELETE /api/products/{id}      # Delete product
GET    /api/orders             # List orders
POST   /api/orders             # Create order
PUT    /api/orders/{id}        # Update order status
GET    /health                 # Health check

# Business Logic:
class OrderService:
    async def create_order(order_data):
        # Validate inventory
        # Calculate totals
        # Apply tax rules
        # Save to MongoDB
        # Update inventory
        # Return confirmation

class ProductService:
    async def list_products():
        # Query MongoDB
        # Apply filters
        # Pagination
        # Return results
```

**Service Communication:**
```
Node.js (Express)
    │
    └─ HTTP POST to Python Service
       Host: localhost:8000
       Path: /api/orders
       
       Inside Python:
       FastAPI receives -> Router handler -> Service layer
       │
       └─ Motor (async MongoDB driver)
          │
          └─ MongoDB query/insert
          │
          └─ Return result
       
       Response back to Node.js
```

#### **Data Persistence Layer (MongoDB, Port 27017)**

```javascript
// Database: nitte_merch_shop
// Collections:

// 1. PRODUCTS Collection
db.products = {
    _id: ObjectId(),
    name: "Wireless Headphones",
    description: "High-quality audio",
    category: "Electronics",
    price: 99.99,
    stock: 42,
    createdAt: ISODate(),
    updatedAt: ISODate(),
    // Indexes: {name: 1}, {category: 1}, {_id: 1}
}

// 2. ORDERS Collection
db.orders = {
    _id: ObjectId(),
    customerId: ObjectId(),
    customerEmail: "user@example.com",
    items: [
        {
            productId: ObjectId(),
            name: "Headphones",
            quantity: 1,
            price: 99.99
        }
    ],
    subtotal: 99.99,
    tax: 8.00,
    total: 107.99,
    status: "pending",  // pending -> processing -> shipped -> delivered
    createdAt: ISODate(),
    updatedAt: ISODate(),
    // Indexes: {customerId: 1}, {status: 1}, {createdAt: -1}
}

// 3. USERS Collection
db.users = {
    _id: ObjectId(),
    email: "user@example.com",
    passwordHash: "bcrypt_hash",
    name: "John Doe",
    role: "user",  // user, admin, support
    createdAt: ISODate(),
    // Indexes: {email: 1} (unique), {_id: 1}
}

// Query Examples:
// Find all products
db.products.find({})

// Find orders for user
db.orders.find({customerId: ObjectId(...)})

// Update order status
db.orders.updateOne({_id: ObjectId(...)}, {$set: {status: "shipped"}})

// Real-time stats
db.orders.aggregate([
    {$match: {createdAt: {$gte: new Date('2024-01-01')}}},
    {$group: {_id: '$status', count: {$sum: 1}, total: {$sum: '$total'}}}
])
```

---

## 📦 Project Components

### 1. **Frontend Applications** (`/frontend` & `/admin-dashboard`)

React-based single-page applications using:
- **Vite**: Lightning-fast build tool (~300ms dev startup)
- **Tailwind CSS**: Utility-first styling with responsive design
- **Axios**: Promise-based HTTP client for API calls
- **Recharts**: Data visualization for admin charts
- **Lucide React**: Icon library for UI elements
- **React Router**: Client-side routing (if needed)

### 2. **API Gateway** (`/node-backend`)

Node.js Express server handling:
- HTTP routing and request handling
- JWT authentication and session management
- Request validation and error handling
- Prometheus metrics collection for monitoring
- Service-to-service communication with Python backend
- CORS and security middleware

Key files:
```
node-backend/
├── src/
│   ├── index.js                 # Server entry point
│   ├── config/
│   │   ├── database.js         # MongoDB connection
│   │   ├── index.js            # Config management
│   │   └── logger.js           # Logging setup
│   ├── middleware/
│   │   ├── index.js            # Auth, CORS, etc
│   │   └── errorHandler.js     # Error middleware
│   ├── routes/
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── products.js         # Product routes
│   │   └── orders.js           # Order routes
│   └── services/
│       ├── authService.js      # JWT & password logic
│       └── pythonServiceClient.js  # Python backend call
├── package.json                # Dependencies
├── Dockerfile                  # Docker image definition
└── .env.example               # Environment template
```

### 3. **Microservice** (`/python-service`)

Python FastAPI service handling:
- Product CRUD operations
- Order processing and fulfillment
- Inventory management
- Async database operations with Motor
- Data validation with Pydantic
- Health checks and metrics

Key files:
```
python-service/
├── app/
│   ├── main.py                 # FastAPI app setup
│   ├── config.py              # Configuration
│   ├── api/
│   │   ├── routes/
│   │   │   ├── products.py    # Product endpoints
│   │   │   └── orders.py      # Order endpoints
│   │   └── models.py          # Pydantic models
│   └── db/
│       └── database.py        # MongoDB Motor connection
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker image definition
└── .env.example              # Environment template
```

### 4. **Database** (`/database`)

MongoDB initialization and configuration:
- Sample product data
- Sample order templates
- User accounts for testing
- Database indexes and constraints

### 5. **Container Orchestration**

**Docker** (`/docker`):
- `docker-compose.yml`: Multi-container local development
- Brings up Node.js, Python, and MongoDB together
- Environment variable injection
- Network creation for internal communication
- Volume mounting for data persistence
- Health checks for container monitoring

**Kubernetes** (`/k8s`):
- Complete production-ready manifests
- Deployments for Node.js and Python services
- StatefulSet for MongoDB
- Services for internal communication
- Ingress for external traffic routing
- ConfigMaps for configuration
- Secrets for sensitive data
- HorizontalPodAutoscaler for auto-scaling
- PodDisruptionBudget for high availability

### 6. **CI/CD Pipeline** (`/jenkins`)

Jenkins Jenkinsfile with stages:
```
Webhook Trigger (GitHub push)
    
Checkout (clone repository)
    
Lint Code (ESLint, Pylint)
    
Build Docker Images (Node.js + Python)
    
Run Tests (unit + integration)
    
Push to Registry (Docker Hub)
    
Deploy to Kubernetes (staging/production)
    
Run Smoke Tests
    
Health Check & Notification
```

### 7. **Monitoring Stack** (`/monitoring`)

- **Prometheus**: Scrapes metrics from all services
  - HTTP request counts
  - Request latency (p50, p95, p99)
  - Error rates
  - Database query times
  
- **Grafana**: Visualizes metrics in dashboards
  - Real-time system overview
  - Service health status
  - Request trends
  
- **Jaeger**: Distributed request tracing
  - Request journey through services
  - Latency breakdown per service
  - Error tracking and debugging

### 8. **Client Libraries** (`/clients`)

Helper libraries for integrating NITTE Merch Shop:
- **JavaScript Client**: `NitteMerchClient.js` for browser/Node.js
- **Python Client**: `nitte_merch_client.py` for Python projects

---

## 🔄 Data Flow Example: Complete Order Journey

### Step 1: Customer Views Products
```
Browser (localhost:5173)
  └─ GET /api/products
     └─ Node.js (port 3000)
        ├─ Validate request
        ├─ Log to Prometheus
        └─ Forward to Python (8000)
            └─ Python Service
               ├─ Query MongoDB: db.products.find()
               └─ Return: [{_id: "...", name: "...", price: ...}, ...]
```

Response to Browser:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Wireless Headphones",
    "price": 99.99,
    "stock": 42
  },
  ...
]
```

### Step 2: Customer Places Order
```
Browser (React state in cart)
  └─ POST /api/orders
     {
       "customerId": "...",
       "items": [{"productId": "...", "quantity": 1}],
       "total": 107.99
     }
     └─ Node.js (port 3000)
        ├─ Validate JWT token
        ├─ Validate order data
        ├─ Increment prometheus counter
        └─ Forward to Python (8000)
            └─ Python Service
               ├─ Check inventory
               ├─ Calculate tax (8%)
               ├─ Start MongoDB transaction
               ├─ db.orders.insertOne({order})
               ├─ db.products.updateOne({decrement stock})
               ├─ Commit transaction
               └─ Return: {orderId: "...", status: "pending"}
```

Response to Browser:
```json
{
  "orderId": "507f1f77bcf86cd799439012",
  "status": "pending",
  "total": 107.99,
  "createdAt": "2024-01-15T10:30:00Z",
  "confirmation": "Order placed successfully!"
}
```

### Step 3: Admin Updates Order Status
```
Browser (Admin Dashboard, localhost:5174)
  └─ PUT /api/orders/507f1f77bcf86cd799439012
     {"status": "shipped"}
     └─ Node.js (port 3000)
        ├─ Verify admin role
        ├─ Validate status transition
        └─ Forward to Python (8000)
            └─ Python Service
               └─ db.orders.updateOne({_id: "..."}, {$set: {status: "shipped"}})
```

### Step 4: Data Appears in Monitoring
```
Prometheus Scrapes Metrics
  ├─ http_requests_total (incremented)
  ├─ request_duration_seconds (recorded)
  └─ order_status_changes (event recorded)

Grafana Shows:
  ├─ API Request Graph 
  ├─ Average Latency: 245ms
  └─ Success Rate: 100%

Jaeger Shows:
  Trace: POST /api/orders/:id
    ├─ Span: API Gateway (25ms)
    ├─ Span: Python Service (45ms)
    │   └─ Span: MongoDB Query (15ms)
    └─ Total: 85ms
```

---

##  Getting Started - Quick Setup (2 Minutes)

### Automatic Complete Setup
Run this single script that does **everything automatically**:

```bash
# Linux/Mac:
bash nitte-setup.sh

# Windows (PowerShell):
bash nitte-setup.sh
```

This script will:
1.  Check all prerequisites
2.  Start Docker backend services
3.  Install frontend dependencies
4.  Start both React applications
5.  Open browsers automatically
6.  Show system status and demo guide

**That's it!** All components run together with real-time features enabled.

### Manual Setup (If You Prefer)
If you want more control, use detailed step-by-step guides:
- **Linux users**: See [SETUP_LINUX.md](SETUP_LINUX.md)
- **macOS users**: See [SETUP_MAC.md](SETUP_MAC.md)
- **Windows users**: See [SETUP_WINDOWS.md](SETUP_WINDOWS.md)

---

## 📊 System Requirements

### Minimum (Development)
- 4 GB RAM
- 10 GB Disk space
- Docker Desktop (includes Docker & Docker Compose)
- Node.js 18+ & npm
- Python 3.9+

### Recommended (Production)
- 8+ GB RAM
- 50+ GB Disk space
- Kubernetes cluster (3+ nodes)
- Load balancer
- Backup storage (hourly MongoDB snapshots)

---

## 📚 Documentation Structure

All documentation is organized in the root folder and `/docs` folder:

| Document | Purpose |
|----------|---------|
| SETUP_LINUX.md | Step-by-step Linux installation |
| SETUP_MAC.md | Step-by-step macOS installation |
| SETUP_WINDOWS.md | Step-by-step Windows installation |
| docs/JENKINS_SETUP.md | Jenkins CI/CD pipeline setup |
| docs/QUICK_START.md | Quick startup commands |
| docs/EXECUTION_TUTORIAL.md | Detailed execution guide |
| docs/ARCHITECTURE.md | System design and patterns |
| docs/API_DOCUMENTATION.md | API endpoint reference |
| docs/DEPLOYMENT.md | Production deployment guide |
| docs/TROUBLESHOOTING.md | Problem diagnosis and solutions |
| docs/FILE_STRUCTURE.md | Complete directory structure |
| docs/PROJECT_PLAN.md | Original project plan |
| docs/COMPLETE_SUMMARY.md | Feature summary |
| docs/DEMO_WITH_FRONTENDS.md | Demo walkthrough |
| docs/FRONTEND_SETUP_GUIDE.md | Frontend-specific guide |

---

## 🎯 Next Steps

1. **Choose your setup method**:
   - Linux user? -> Follow `SETUP_LINUX.md`
   - Windows user? -> Follow `SETUP_WINDOWS.md`

2. **Start the system**:
   ```bash
   docker compose -f docker/docker-compose.yml up -d
   cd frontend && npm install && npm run dev
   cd ../admin-dashboard && npm install && npm run dev
   ```

3. **Access the system**:
   - User Frontend: http://localhost:5173
   - Admin Dashboard: http://localhost:5174
   - API: http://localhost:3000

4. **Explore documentation**:
   - Read `docs/DEMO_WITH_FRONTENDS.md` for demo scenarios
   - Check `docs/API_DOCUMENTATION.md` for API endpoints
   - See `docs/TROUBLESHOOTING.md` for common issues

---

## 🤝 Need Help?

- Check `docs/TROUBLESHOOTING.md` for solutions
- Review `docs/QUICK_START.md` for quick reference
- Read the relevant setup guide (Linux/Windows)
- Check Docker logs: `docker logs <container_name>`
- Check application logs in `/var/log/` or container logs

---

## 📝 License

This project is part of the NITTE Merchandise Shop system.

---

**Last Updated**: March 2024
**Status**: Production Ready 
**Version**: 2.0 (With React Frontends)