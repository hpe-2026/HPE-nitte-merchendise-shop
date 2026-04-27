# Complete Project File Structure & Overview

## 📁 Full Directory Tree

```
nitte-merch-shop/
│
├── 📄 README.md                        ← START HERE - Project overview
├── 📄 QUICK_START.md                   ← Quick reference for 4 execution methods
├── 📄 EXECUTION_TUTORIAL.md            ← Detailed step-by-step guide
├── 📄 PROJECT_PLAN.md                  ← Full project plan and deliverables
├── 📄 .gitignore                       ← Git exclude patterns
│
├── 📂 node-backend/                    ← Node.js Express API Gateway (Port 3000)
│   ├── 📂 src/
│   │   ├── 📂 config/
│   │   │   ├── index.js               ← Configuration management
│   │   │   ├── logger.js              ← Winston logging setup
│   │   │   └── database.js            ← MongoDB connection
│   │   │
│   │   ├── 📂 middleware/
│   │   │   └── index.js               ← Auth, error handler, request logger
│   │   │
│   │   ├── 📂 routes/
│   │   │   ├── auth.js                ← Sign up, login, refresh token
│   │   │   ├── products.js            ← Product CRUD endpoints
│   │   │   └── orders.js              ← Order management endpoints
│   │   │
│   │   ├── 📂 services/
│   │   │   ├── authService.js         ← JWT and password handling
│   │   │   └── pythonServiceClient.js ← Calls Python service via HTTP
│   │   │
│   │   └── index.js                   ← Express app entry point
│   │
│   ├── package.json                   ← Dependencies and scripts
│   ├── Dockerfile                     ← Multi-stage Docker build
│   ├── .env.example                   ← Environment template
│   └── .dockerignore                  ← Docker ignore patterns
│
├── 📂 python-service/                  ← Python FastAPI Service (Port 8000)
│   ├── 📂 app/
│   │   ├── 📂 api/
│   │   │   ├── models.py              ← Pydantic data models
│   │   │   ├── 📂 routes/
│   │   │   │   ├── products.py        ← Product endpoints
│   │   │   │   ├── orders.py          ← Order endpoints
│   │   │   │   └── __init__.py
│   │   │   └── __init__.py
│   │   │
│   │   ├── 📂 db/
│   │   │   ├── database.py            ← MongoDB async connection
│   │   │   └── __init__.py
│   │   │
│   │   ├── config.py                  ← Settings management
│   │   ├── main.py                    ← FastAPI app entry point
│   │   └── __init__.py
│   │
│   ├── requirements.txt                ← Python dependencies
│   ├── Dockerfile                     ← Multi-stage Docker build
│   ├── .env.example                   ← Environment template
│   └── .dockerignore                  ← Docker ignore patterns
│
├── 📂 database/                        ← MongoDB Configuration
│   ├── 📂 init-scripts/
│   │   └── init.js                    ← Initialize collections, indexes, sample data
│   └── docker-compose-mongo.yml       ← Standalone MongoDB compose (optional)
│
├── 📂 docker/                          ← Docker Configuration
│   ├── docker-compose.yml             ← Multi-container orchestration
│   └── .dockerignore                  ← Common ignore patterns
│
├── 📂 k8s/                            ← Kubernetes Manifests
│   ├── namespace.yaml                 ← nitte-merch namespace definition
│   │
│   ├── 📂 mongodb/
│   │   └── statefulset.yaml           ← MongoDB StatefulSet, Service, Secret, PVC
│   │
│   ├── 📂 python-service/
│   │   └── deployment.yaml            ← Python Deployment, Service, ConfigMap
│   │
│   ├── 📂 node-backend/
│   │   └── deployment.yaml            ← Node.js Deployment, Service, ConfigMap
│   │
│   └── ingress.yaml                   ← Ingress, HPA, PDB, RBAC, JWT Secret
│
├── 📂 jenkins/                         ← CI/CD Configuration
│   ├── Jenkinsfile                    ← Full pipeline definition
│   └── 📂 scripts/
│       ├── build.sh                   ← Build script
│       ├── test.sh                    ← Test script
│       └── deploy.sh                  ← Deploy script
│
└── 📂 docs/                           ← Documentation
    ├── ARCHITECTURE.md                ← System design, components, security
    ├── API_DOCUMENTATION.md           ← Complete API reference
    ├── DEPLOYMENT.md                  ← Production deployment guide
    └── TROUBLESHOOTING.md             ← Common issues and solutions

```

---

## 📊 File Summary

### Root Level Files

| File | Purpose | Size |
|------|---------|------|
| `README.md` | Project overview & quick info | 4 KB |
| `QUICK_START.md` | 4 methods to run project | 6 KB |
| `EXECUTION_TUTORIAL.md` | Detailed step-by-step guide | 12 KB |
| `PROJECT_PLAN.md` | Full project details | 8 KB |
| `.gitignore` | Git ignore patterns | 2 KB |

### Node.js Backend (Complete API Gateway)

| Component | Files | Purpose |
|-----------|-------|---------|
| **Config** | config/*.js | Environment, logging, database |
| **Middleware** | middleware/index.js | Auth, error handling, logging |
| **Routes** | routes/*.js | API endpoints (auth, products, orders) |
| **Services** | services/*.js | Business logic & service calls |
| **Entry** | src/index.js | Express server |
| **Package** | package.json | Dependencies (express, axios, jwt, etc.) |
| **Container** | Dockerfile | Multi-stage Node build |
| **Config** | .env.example | Environment variables template |

**Total Node Files**: 10 files

### Python Service (Complete Business Logic)

| Component | Files | Purpose |
|-----------|-------|---------|
| **Models** | api/models.py | Pydantic data validation |
| **Routes** | api/routes/*.py | Product & order endpoints |
| **Database** | db/database.py | MongoDB async connection |
| **Config** | config.py | Settings management |
| **Entry** | app/main.py | FastAPI server |
| **Package** | requirements.txt | Dependencies (fastapi, pymongo, etc.) |
| **Container** | Dockerfile | Multi-stage Python build |
| **Config** | .env.example | Environment variables template |

**Total Python Files**: 8 files

### Database Configuration

| File | Purpose |
|------|---------|
| `database/init-scripts/init.js` | Sample data & indexes initialization |

**Total DB Files**: 1 file

### Docker Configuration

| File | Lines | Purpose |
|------|-------|---------|
| `docker/docker-compose.yml` | 120 | 3-service orchestration (MongoDB, Python, Node) |
| `docker/.dockerignore` | 30 | What to exclude from images |

**Total Docker Files**: 2 files

### Kubernetes Configuration

| File | Lines | Type | Purpose |
|------|-------|------|---------|
| `k8s/namespace.yaml` | 5 | Namespace | Create nitte-merch namespace |
| `k8s/mongodb/statefulset.yaml` | 180 | StatefulSet + Service + Secret | MongoDB with persistence |
| `k8s/python-service/deployment.yaml` | 130 | Deployment + Service + ConfigMap | Python service with 2 replicas |
| `k8s/node-backend/deployment.yaml` | 130 | Deployment + Service + ConfigMap | Node.js gateway with 2 replicas |
| `k8s/ingress.yaml` | 200 | Ingress + HPA + PDB + RBAC + Secrets | External access & auto-scaling |

**Total K8s Files**: 5 files

### Jenkins CI/CD

| File | Lines | Purpose |
|------|-------|---------|
| `jenkins/Jenkinsfile` | 300+ | Full pipeline (build, test, docker, deploy) |
| `jenkins/scripts/build.sh` | 30 | Build Node and Python services |
| `jenkins/scripts/test.sh` | 25 | Run tests for both services |
| `jenkins/scripts/deploy.sh` | 40 | Deploy to Kubernetes |

**Total Jenkins Files**: 4 files

### Documentation

| File | Purpose | Size |
|------|---------|------|
| `docs/ARCHITECTURE.md` | System design, components, data models | 8 KB |
| `docs/API_DOCUMENTATION.md` | Complete API endpoints reference | 10 KB |
| `docs/DEPLOYMENT.md` | Local, staging, production guides | 12 KB |
| `docs/TROUBLESHOOTING.md` | Common issues and solutions | 15 KB |

**Total Docs**: 4 files, 45 KB

---

## 📈 Project Statistics

```
Total Files Created: 40+
Total Lines of Code: 3,000+
Total Documentation: 50+ KB
Total Size: ~5 MB (without node_modules and venv)

Breakdown:
├── Node.js Code: 700+ lines
├── Python Code: 400+ lines
├── Kubernetes YAML: 500+ lines
├── Docker YAML: 120 lines
├── Jenkins Pipeline: 300+ lines
└── Documentation: 2,000+ lines
```

---

##  File Dependencies

```
API Request Flow:
   Client
     
   node-backend/src/index.js (Express server)
     
   node-backend/src/routes/*.js (Route handlers)
     
   node-backend/src/middleware/index.js (Auth check)
     
   node-backend/src/services/pythonServiceClient.js (HTTP call)
     
   python-service/app/main.py (FastAPI server)
     
   python-service/app/api/routes/*.py (Endpoints)
     
   python-service/app/db/database.py (MongoDB query)
     
   MongoDB Database

Authentication Flow:
   client/signup -> routes/auth.js -> authService.js -> MongoDB
   client/login -> routes/auth.js -> authService.js -> MongoDB
   API request -> middleware/index.js -> authService.verifyToken()

Product Flow:
   GET /products -> routes/products.js -> pythonServiceClient.js
     -> python-service/routes/products.py -> database.py -> MongoDB

Order Flow:
   POST /orders -> routes/orders.js -> pythonServiceClient.js
     -> python-service/routes/orders.py -> database.py -> MongoDB
```

---

##  Execution Flow

```
Docker Compose Method:
   docker-compose up -d
        
   Reads: docker/docker-compose.yml
        
   Builds: node-backend/Dockerfile
   Builds: python-service/Dockerfile
        
   Starts: MongoDB (init-scripts/init.js)
   Starts: Python service
   Starts: Node.js gateway
        
   All services on nitte-network
        
   APIs ready at localhost:3000 & :8000

Kubernetes Method:
   kubectl apply -f k8s/namespace.yaml
        
   kubectl apply -f k8s/mongodb/statefulset.yaml
        
   kubectl apply -f k8s/python-service/deployment.yaml
        
   kubectl apply -f k8s/node-backend/deployment.yaml
        
   kubectl apply -f k8s/ingress.yaml
        
   Services running with auto-scaling & health checks

Jenkins Method:
   New pipeline job
        
   Jenkinsfile execution
        
   Checkout code
   Build both services
   Run tests
   Build Docker images
   Push to registry
   Deploy to Kubernetes
   Run smoke tests
```

---

## 📝 Key Configuration Files

### Node.js Configuration
- **node-backend/.env**: Environment variables (JWT secret, MongoDB URL, Python service URL)
- **node-backend/package.json**: Dependencies (express, axios, mongodb, jwt, etc.)
- **node-backend/src/config/index.js**: Configuration loading

### Python Configuration
- **python-service/.env**: Environment variables (MongoDB URL, port, environment)
- **python-service/requirements.txt**: Dependencies (fastapi, pymongo, motor, pydantic, etc.)
- **python-service/app/config.py**: Settings using Pydantic

### Docker Configuration
- **docker/docker-compose.yml**: 3-service orchestration with networks and volumes

### Kubernetes Configuration
- **k8s/namespace.yaml**: Namespace for all resources
- **k8s/*/deployment.yaml**: Service deployments with ConfigMaps
- **k8s/mongodb/statefulset.yaml**: Persistent MongoDB deployment
- **k8s/ingress.yaml**: External access, auto-scaling, security

### CI/CD Configuration
- **jenkins/Jenkinsfile**: Multi-stage pipeline
- **jenkins/scripts/*.sh**: Build, test, deploy scripts

---

## 🔐 Security Elements

| File | Security Feature |
|------|-----------------|
| node-backend/src/middleware/index.js | JWT authentication |
| node-backend/src/routes/*.js | Role-based authorization |
| node-backend/src/services/authService.js | Password hashing (bcryptjs) |
| node-backend/src/index.js | CORS, Helmet, Rate limiting |
| k8s/ingress.yaml | Secret management for JWT |
| k8s/mongodb/statefulset.yaml | Secret management for credentials |
| docker/docker-compose.yml | Environment variable security |

---

## 📖 Documentation Map

```
README.md (START)
   ├─-> QUICK_START.md (Choose method)
   │    ├─-> EXECUTION_TUTORIAL.md (Detailed steps)
   │    └─-> docker-compose.yml (Method 1)
   │    └─-> requirements.txt (Method 2)
   │    └─-> k8s/*.yaml (Method 3)
   │    └─-> jenkins/Jenkinsfile (Method 4)
   │
   ├─-> docs/ARCHITECTURE.md (Understand system)
   ├─-> docs/API_DOCUMENTATION.md (API reference)
   ├─-> docs/DEPLOYMENT.md (Production setup)
   ├─-> docs/TROUBLESHOOTING.md (Problem solving)
   │
   └─-> PROJECT_PLAN.md (Full project info)
```

---

##  What Each File Does

### Essential Files to Understand First

1. **README.md** - Read this first for overview
2. **QUICK_START.md** - Pick your execution method
3. **docker/docker-compose.yml** or **node-backend/src/index.js** - Understand architecture
4. **python-service/app/main.py** - Business logic entry point
5. **k8s/node-backend/deployment.yaml** - Production setup

### By Role

**Frontend Developer**
- Needs: docs/API_DOCUMENTATION.md + QUICK_START.md
- Test: API endpoints with curl

**Backend Developer**
- Needs: node-backend/src/ + python-service/app/
- EXECUTION_TUTORIAL.md (Method 2)
- docs/ARCHITECTURE.md

**DevOps Engineer**
- Needs: k8s/ + docker/ + jenkins/
- EXECUTION_TUTORIAL.md (Method 3 & 4)
- docs/DEPLOYMENT.md

**Database Administrator**
- Needs: database/init-scripts/init.js
- docs/TROUBLESHOOTING.md
- MongoDB configuration in k8s/mongodb/

---

## 🎯 Recommended Reading Order

```
1. README.md (5 min)
   
2. QUICK_START.md (2 min)
   
3. Choose method -> EXECUTION_TUTORIAL.md (10-30 min depending on method)
   
4. docs/ARCHITECTURE.md (10 min)
   
5. docs/API_DOCUMENTATION.md (5 min)
   
6. docs/DEPLOYMENT.md (if going to production)
   
7. docs/TROUBLESHOOTING.md (as needed)
```

---

## 📱 Quick File Lookup

**"How do I..."**

| Question | File |
|----------|------|
| Start the project? | QUICK_START.md |
| Set up locally? | EXECUTION_TUTORIAL.md |
| Understand architecture? | docs/ARCHITECTURE.md |
| Use the API? | docs/API_DOCUMENTATION.md |
| Deploy to production? | docs/DEPLOYMENT.md |
| Fix a problem? | docs/TROUBLESHOOTING.md |
| Understand the code? | node-backend/src/index.js, python-service/app/main.py |
| Run tests? | node-backend/package.json, python-service/requirements.txt |
| Deploy to Kubernetes? | k8s/*.yaml |
| Set up CI/CD? | jenkins/Jenkinsfile |
| Modify database? | database/init-scripts/init.js |
| Change configuration? | .env.example files |

---

## 🔄 File Update Guide

When you need to change something:

| Change Type | Files to Update |
|------------|-----------------|
| Add new API endpoint | node-backend/src/routes/*.js |
| Add business logic | python-service/app/api/routes/*.py |
| Change database schema | database/init-scripts/init.js + python-service/app/api/models.py |
| Update dependencies | package.json or requirements.txt |
| Change configuration | .env files |
| Update Kubernetes resources | k8s/*.yaml |
| Modify pipeline | jenkins/Jenkinsfile |
| Update documentation | docs/*.md |

---

**All files are organized, documented, and ready to use!** 
