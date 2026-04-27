# Quick Start Guide - 4 Methods

## Method 1: Docker Compose (* EASIEST - 5 MINUTES)

```bash
# Navigate to project
cd nitte-merch-shop

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Check health
curl http://localhost:3000/api/health
curl http://localhost:8000/health

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop
docker-compose -f docker/docker-compose.yml down
```

**URLs:**
- API Gateway: http://localhost:3000
- Python Service: http://localhost:8000
- MongoDB: localhost:27017

---

## Method 2: Direct Local Installation (15 MINUTES)

### Terminal 1: MongoDB
```bash
docker run -d \
  --name nitte-mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -p 27017:27017 \
  mongo:7.0-alpine
```

### Terminal 2: Python Service
```bash
cd python-service
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

### Terminal 3: Node.js Backend
```bash
cd node-backend
npm install
cp .env.example .env
npm run dev
```

**URLs:**
- API Gateway: http://localhost:3000
- Python Service: http://localhost:8000
- MongoDB: localhost:27017

---

## Method 3: Kubernetes (20 MINUTES)

### Prerequisites
```bash
# Minikube
minikube start --cpus=4 --memory=4096
```

### Deploy
```bash
# 1. Create namespace
kubectl create namespace nitte-merch

# 2. Build images
docker build -t nitte-merch-shop/python-service:latest -f python-service/Dockerfile python-service/
docker build -t nitte-merch-shop/node-backend:latest -f node-backend/Dockerfile node-backend/

# 3. Deploy MongoDB
kubectl apply -f k8s/mongodb/statefulset.yaml
kubectl wait --for=condition=ready pod -l app=mongodb -n nitte-merch --timeout=300s

# 4. Deploy Python Service
kubectl apply -f k8s/python-service/deployment.yaml

# 5. Deploy Node Backend
kubectl apply -f k8s/node-backend/deployment.yaml

# 6. Deploy Ingress
kubectl apply -f k8s/ingress.yaml
```

### Check Status
```bash
kubectl get pods -n nitte-merch
kubectl get svc -n nitte-merch
kubectl logs deployment/node-backend -n nitte-merch -f
```

### Port Forward
```bash
# Terminal 1
kubectl port-forward -n nitte-merch svc/node-backend 3000:3000

# Terminal 2
kubectl port-forward -n nitte-merch svc/python-service 8000:8000
```

**URLs:** (after port forward)
- API Gateway: http://localhost:3000
- Python Service: http://localhost:8000

---

## Method 4: Jenkins CI/CD (30 MINUTES)

### Setup Jenkins
```bash
# 1. Install Jenkins plugins:
#    - Docker Pipeline
#    - Kubernetes CLI
#    - Git
#    - Email Extension

# 2. Create credentials:
#    - docker-credentials (username/password)
#    - kubeconfig (secret file with ~/.kube/config)
#    - sonar-token (secret text)
```

### Create Job
```bash
# 1. New Item -> Multibranch Pipeline
# 2. Name: nitte-merch-shop
# 3. Repository: https://github.com/nitte-dev/nitte-merch-shop.git
# 4. Script path: jenkins/Jenkinsfile
# 5. Save
```

### Run Pipeline
```bash
# Click "Scan Multibranch Pipeline Now"
# Click branch (main/develop)
# Click "Build Now"
# Monitor in "Console Output"
```

Pipeline stages:
1.  Checkout
2.  Build & Test
3.  Code Quality
4.  Docker Build & Push
5.  Deploy to Staging (develop)
6.  Deploy to Production (main)
7.  Smoke Tests

---

## Quick API Tests

### 1. Signup
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Save the `access_token` from response**

### 2. Get Products
```bash
export TOKEN="your_access_token"

curl http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Create Order
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [{"product_id": "product_id_here", "quantity": 2}],
    "shipping_address": "123 Main St, City",
    "notes": "Express delivery"
  }'
```

### 4. Get Orders
```bash
curl http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Health Checks
```bash
# Gateway health
curl http://localhost:3000/api/health

# Python service health
curl http://localhost:8000/health

# Full status
curl http://localhost:3000/api/v1/service-health
```

---

## Comparison Table

| Aspect | Docker Compose | Direct Install | Kubernetes | Jenkins |
|--------|-------|--------|-----------|---------|
| **Time** | 5 min | 15 min | 20 min | 30 min |
| **Difficulty** | * Easy | ** Medium | *** Hard | *** Hard |
| **Best For** | Quick testing | Learning | Production | Full CI/CD |
| **Resource** | 2GB RAM | 1GB RAM | 4GB RAM | 2GB RAM |
| **OS** | All | All | All | Linux/macOS |
| **Setup** | 1 command | 3 terminals | kubectl | Jenkins UI |

---

## Recommended Path

1. **Start with Docker Compose** ← Try this first!
   - Quickest way to see it working
   - No installation needed (just Docker)
   - Perfect for demo/testing

2. **Then try Direct Installation**
   - Understand each service separately
   - Better for development
   - See real logs and errors

3. **Finally Kubernetes**
   - See it at scale
   - Production-like environment
   - Test deployments

4. **Jenkins CI/CD** (Optional)
   - Full automation
   - Real-world pipeline
   - Team collaboration

---

## Common Commands

```bash
# Docker Compose
docker-compose -f docker/docker-compose.yml up -d
docker-compose -f docker/docker-compose.yml logs -f
docker-compose -f docker/docker-compose.yml down

# Kubernetes
kubectl get pods -n nitte-merch
kubectl logs deployment/node-backend -n nitte-merch
kubectl delete namespace nitte-merch

# npm (Node)
npm install
npm run dev
npm test

# pip (Python)
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
pytest

# curl (API testing)
curl http://localhost:3000/api/health
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/products
```

---

## Troubleshooting Quick Fixes

```bash
# Port already in use
lsof -i :3000  # Find what's using it
kill -9 <PID>  # Kill process

# Docker won't start
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml up -d

# MongoDB connection
mongosh "mongodb://admin:password@localhost:27017"

# Kubernetes pod stuck
kubectl describe pod <pod-name> -n nitte-merch
kubectl logs <pod-name> -n nitte-merch

# npm issue
npm cache clean --force
npm install --legacy-peer-deps

# Python venv
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## What to Do Next

1.  Choose a method (recommend Docker Compose)
2.  Follow the steps in EXECUTION_TUTORIAL.md
3.  Test APIs with curl commands above
4.  Check ARCHITECTURE.md for system design
5.  Read API_DOCUMENTATION.md for all endpoints
6.  Review DEPLOYMENT.md for production setup

---

## Success Indicators

 Node.js Gateway running on port 3000
 Python Service running on port 8000
 MongoDB storing data
 Can signup and login
 Can create and view orders
 Can create and list products
 Health check endpoints return 200

---

**Choose your method and get started! **
