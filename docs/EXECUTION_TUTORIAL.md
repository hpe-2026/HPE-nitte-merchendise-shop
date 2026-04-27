# NITTE Merchandise Shop - Step-by-Step Execution Tutorial

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Option 1: Local Development with Docker Compose](#option-1-local-development-with-docker-compose)
3. [Option 2: Direct Local Installation](#option-2-direct-local-installation)
4. [Option 3: Kubernetes Deployment](#option-3-kubernetes-deployment)
5. [Option 4: Jenkins CI/CD Setup](#option-4-jenkins-cicd-setup)
6. [Testing the APIs](#testing-the-apis)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### For All Options
- Git installed
- Project cloned: `git clone <repository-url>`
- Terminal/Command Prompt

### For Docker Compose (Easiest)
- Docker Desktop installed https://www.docker.com/products/docker-desktop
- Docker Compose (included with Docker Desktop)
- 4GB+ RAM allocated to Docker

### For Direct Installation
- Node.js 18+ https://nodejs.org/
- Python 3.11+ https://www.python.org/
- MongoDB 7.0+ https://www.mongodb.com/try/download/community

### For Kubernetes
- kubectl CLI https://kubernetes.io/docs/tasks/tools/
- Kubernetes cluster (minikube/kind for local testing)
- kubeconfig configured

### For Jenkins
- Jenkins 2.387+ https://www.jenkins.io/
- Docker installed
- Kubernetes cluster access

---

## Option 1: Local Development with Docker Compose

### **EASIEST & RECOMMENDED** *

This is the fastest way to get everything running.

### Step 1: Navigate to Project Directory

```bash
cd c:\Users\Mahe\Desktop\HPE-task-2
# or on macOS/Linux
cd ~/path/to/nitte-merch-shop
```

### Step 2: Create Environment Files

```bash
# Create .env files from examples
cp node-backend/.env.example node-backend/.env
cp python-service/.env.example python-service/.env
```

**node-backend/.env** (should look like):
```
NODE_ENV=development
PORT=3000
PYTHON_SERVICE_URL=http://python-service:8000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d
MONGODB_URL=mongodb://admin:password@mongodb:27017/nitte_merch_shop?authSource=admin
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
REQUEST_TIMEOUT=30000
```

**python-service/.env** (should look like):
```
ENVIRONMENT=development
PORT=8000
HOST=0.0.0.0
MONGODB_URL=mongodb://admin:password@mongodb:27017/nitte_merch_shop?authSource=admin
DATABASE_NAME=nitte_merch_shop
LOG_LEVEL=info
API_GATEWAY_URL=http://node-backend:3000
```

### Step 3: Start Docker Compose

```bash
# Start all services in background
docker-compose -f docker/docker-compose.yml up -d

# Or with attached output (Ctrl+C to stop)
docker-compose -f docker/docker-compose.yml up
```

**What happens:**
- Downloads images (first time only, ~2-3 minutes)
- Starts MongoDB container
- Starts Python service container
- Starts Node.js backend container
- Creates network for inter-service communication

### Step 4: Verify Services are Running

```bash
# Check all containers
docker-compose -f docker/docker-compose.yml ps

# Output should show all 3 services as "Up"
```

**Expected Output:**
```
NAME                    COMMAND                  SERVICE             STATUS      PORTS
nitte-mongodb           "mongod"                 mongodb             Up          27017/tcp
nitte-python-service    "python -m uvicorn..."  python-service      Up          8000/tcp
nitte-node-backend      "node src/index.js"     node-backend        Up          3000/tcp
```

### Step 5: Check Service Health

```bash
# Check Node.js Gateway health
curl http://localhost:3000/api/health

# Check Python Service health
curl http://localhost:8000/health

# Both should return 200 with status: "healthy" or "pong"
```

### Step 6: View Logs

```bash
# All services logs
docker-compose -f docker/docker-compose.yml logs -f

# Specific service logs
docker-compose -f docker/docker-compose.yml logs -f python-service
docker-compose -f docker/docker-compose.yml logs -f node-backend
docker-compose -f docker/docker-compose.yml logs -f mongodb
```

### Step 7: Stop Services

```bash
# Stop all services (data persists)
docker-compose -f docker/docker-compose.yml down

# Stop and remove volumes (clears database)
docker-compose -f docker/docker-compose.yml down -v
```

---

## Option 2: Direct Local Installation

### For Windows/macOS/Linux without Docker

### Step 1: MongoDB Setup

#### Option A: Using Docker (Easiest)
```bash
docker run -d \
  --name nitte-mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7.0-alpine
```

#### Option B: Native Installation
```bash
# On Windows - use MongoDB installer
# On macOS - brew install mongodb-community
# On Linux - follow MongoDB docs

# Start MongoDB
mongod --dbpath ./data --auth
```

### Step 2: Python Service Setup

```bash
# Navigate to Python service
cd python-service

# Create virtual environment
python -m venv venv

# Activate venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env if needed
# MONGODB_URL=mongodb://admin:password@localhost:27017/nitte_merch_shop?authSource=admin
```

### Step 3: Start Python Service

```bash
# Make sure venv is activated
python -m uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
```

### Step 4: Node.js Setup (New Terminal/Tab)

```bash
# Navigate to Node backend
cd node-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed
# PYTHON_SERVICE_URL=http://localhost:8000
# MONGODB_URL=mongodb://admin:password@localhost:27017/nitte_merch_shop?authSource=admin
```

### Step 5: Start Node.js Backend

```bash
# For development with auto-reload
npm run dev

# Or for production
npm start
```

**Expected Output:**
```
[timestamp] API Gateway started on port 3000
[timestamp] Environment: development
[timestamp] Python Service URL: http://localhost:8000
```

### Step 6: Verify All Services

In a new terminal:
```bash
# Check Node.js
curl http://localhost:3000/api/health

# Check Python
curl http://localhost:8000/health

# Check MongoDB
mongosh localhost:27017 -u admin -p password
```

### Step 7: Stopping Services

```bash
# In each terminal window running a service
Ctrl + C

# Stop MongoDB (if running in Docker)
docker stop nitte-mongodb
```

---

## Option 3: Kubernetes Deployment

### For Production-Like Environment

### Step 1: Setup Kubernetes Cluster

#### Option A: Minikube (Local Testing)
```bash
# Install minikube: https://minikube.sigs.k8s.io/docs/start/

# Start minikube
minikube start --cpus=4 --memory=4096

# Verify cluster
kubectl cluster-info
kubectl get nodes
```

#### Option B: Docker Desktop Kubernetes
```bash
# Enable Kubernetes in Docker Desktop Settings
# Settings -> Kubernetes -> Enable Kubernetes

# Verify
kubectl config current-context  # Should show "docker-desktop"
kubectl get nodes
```

#### Option C: Existing Kubernetes Cluster
```bash
# Set kubeconfig
export KUBECONFIG=~/.kube/config

# Verify access
kubectl cluster-info
```

### Step 2: Build Docker Images

```bash
# Build Node.js backend image
docker build -t nitte-merch-shop/node-backend:latest \
  -f node-backend/Dockerfile node-backend/

# Build Python service image
docker build -t nitte-merch-shop/python-service:latest \
  -f python-service/Dockerfile python-service/

# Verify images
docker images | grep nitte-merch-shop
```

### Step 3: Push Images to Registry (Optional but Recommended)

```bash
# Login to Docker Hub
docker login

# Tag images
docker tag nitte-merch-shop/node-backend:latest \
  YOUR_DOCKER_USERNAME/nitte-merch-shop/node-backend:latest

docker tag nitte-merch-shop/python-service:latest \
  YOUR_DOCKER_USERNAME/nitte-merch-shop/python-service:latest

# Push
docker push YOUR_DOCKER_USERNAME/nitte-merch-shop/node-backend:latest
docker push YOUR_DOCKER_USERNAME/nitte-merch-shop/python-service:latest

# Update image names in k8s/python-service/deployment.yaml
# Update image names in k8s/node-backend/deployment.yaml
```

### Step 4: Create Namespace

```bash
kubectl create namespace nitte-merch

# Verify
kubectl get namespaces | grep nitte-merch
```

### Step 5: Deploy MongoDB

```bash
# Apply MongoDB StatefulSet
kubectl apply -f k8s/mongodb/statefulset.yaml

# Wait for MongoDB to be ready (may take 1-2 minutes)
kubectl get pods -n nitte-merch -w

# Exit when mongodb-0 shows "1/1" running
# Press Ctrl+C to exit watch
```

### Step 6: Verify MongoDB is Ready

```bash
# Check pod status
kubectl get pods -n nitte-merch

# Check logs
kubectl logs mongodb-0 -n nitte-merch

# Connect to MongoDB (optional)
kubectl exec -it mongodb-0 -n nitte-merch -- mongosh

# In mongosh:
# db.adminCommand('ping')
# exit
```

### Step 7: Deploy Python Service

```bash
# Apply Python service deployment
kubectl apply -f k8s/python-service/deployment.yaml

# Watch deployment
kubectl get pods -n nitte-merch -w

# Wait for 2 pods running
# Press Ctrl+C to exit
```

### Step 8: Verify Python Service

```bash
# Check pods
kubectl get pods -n nitte-merch

# Check logs
kubectl logs deployment/python-service -n nitte-merch -f

# Port forward to test locally
kubectl port-forward -n nitte-merch svc/python-service 8000:8000

# In another terminal, test
curl http://localhost:8000/health
```

### Step 9: Deploy Node Backend

```bash
# Apply Node backend deployment
kubectl apply -f k8s/node-backend/deployment.yaml

# Watch deployment
kubectl get pods -n nitte-merch -w

# Wait for 2 pods running
```

### Step 10: Verify Node Backend

```bash
# Check pods
kubectl get pods -n nitte-merch

# Port forward to test
kubectl port-forward -n nitte-merch svc/node-backend 3000:3000

# In another terminal, test
curl http://localhost:3000/api/health
```

### Step 11: Deploy Ingress (Optional)

```bash
# For external access (requires ingress controller)
kubectl apply -f k8s/ingress.yaml

# Check ingress
kubectl get ingress -n nitte-merch
```

### Step 12: View All Resources

```bash
# All deployments
kubectl get deployments -n nitte-merch

# All services
kubectl get svc -n nitte-merch

# All pods
kubectl get pods -n nitte-merch

# All persistent volumes
kubectl get pvc -n nitte-merch
```

### Step 13: Cleanup (if needed)

```bash
# Delete everything in namespace
kubectl delete namespace nitte-merch

# Verify deletion
kubectl get namespaces
```

---

## Option 4: Jenkins CI/CD Setup

### Prerequisites
- Jenkins installed and running
- Docker installed on Jenkins server
- kubectl installed on Jenkins server
- Kubernetes cluster access configured

### Step 1: Jenkins Plugins Installation

1. Go to Jenkins Dashboard
2. **Manage Jenkins** -> **Manage Plugins**
3. Search and install:
   - `Docker Pipeline`
   - `Kubernetes CLI`
   - `Git`
   - `Email Extension`
   - `Blue Ocean` (optional, for better UI)

### Step 2: Create Jenkins Credentials

1. **Manage Jenkins** -> **Manage Credentials**
2. Click **System** in left sidebar
3. Click **Global credentials (unrestricted)**

**Add Docker Credentials:**
- Click **+ Add Credentials**
- Kind: **Username with password**
- Username: `docker_username`
- Password: `docker_password`
- ID: `docker-credentials`

**Add Kubeconfig:**
- Click **+ Add Credentials**
- Kind: **Secret file**
- Upload your kubeconfig file
- ID: `kubeconfig`

**Add Sonar Token (Optional):**
- Click **+ Add Credentials**
- Kind: **Secret text**
- Secret: `sonar-token-value`
- ID: `sonar-token`

### Step 3: Create Jenkins Job

1. Click **+ New Item**
2. Enter job name: `nitte-merch-shop`
3. Select: **Multibranch Pipeline**
4. Click **OK**

### Step 4: Configure Job

1. **Branch Sources** section:
   - Click **Add source** -> **Git**
   - Repository URL: `https://github.com/nitte-dev/nitte-merch-shop.git`
   - Credentials: Select your GitHub credentials

2. **Build Configuration**:
   - Mode: **by Jenkinsfile**
   - Script Path: `jenkins/Jenkinsfile`

3. **Scan Trigger**:
   - Check "Periodically if not otherwise run"
   - Interval: `1 hour`

4. Click **Save**

### Step 5: First Pipeline Run

1. Go to job page
2. Click **Scan Multibranch Pipeline Now**
3. Wait for scan to complete
4. Click on branch (e.g., `main`)
5. Click **Build Now**

### Step 6: Monitor Pipeline

1. Click on build number (e.g., #1)
2. View **Console Output** for real-time logs
3. See stages: Checkout -> Build & Test -> Docker Build -> Deploy

### Step 7: Check Pipeline Results

```bash
# View all deployments
kubectl get deployments -n nitte-merch

# View pod logs
kubectl logs -l app=node-backend -n nitte-merch -f

# Verify services
kubectl get svc -n nitte-merch
```

---

## Testing the APIs

### Step 1: Get Postman/Curl Ready

#### Option A: Using Curl (Command Line)
```bash
# All examples below use curl
```

#### Option B: Using Postman
1. Download: https://www.postman.com/downloads/
2. Import requests or create manually

### Step 2: Signup User

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Response:** Gets back access_token and refresh_token

**Save the token for next requests:**
```bash
export TOKEN="your_access_token_here"
```

### Step 3: Get All Products

```bash
curl -X GET http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN"
```

**Response:** List of 5 sample products (T-shirt, Bag, Water Bottle, Hoodie, Cap)

### Step 4: Get Single Product

```bash
curl -X GET http://localhost:3000/api/v1/products/PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN"
```

Replace `PRODUCT_ID` with actual product from previous response.

### Step 5: Create Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {
        "product_id": "PRODUCT_ID",
        "quantity": 2
      }
    ],
    "shipping_address": "123 Main St, City, State 12345",
    "notes": "Please deliver in morning"
  }'
```

Replace `PRODUCT_ID` with actual product ID.

### Step 6: Get User Orders

```bash
curl -X GET http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN"
```

### Step 7: Get Specific Order

```bash
curl -X GET http://localhost:3000/api/v1/orders/ORDER_ID \
  -H "Authorization: Bearer $TOKEN"
```

Replace `ORDER_ID` with actual order from previous response.

### Step 8: Health Checks

```bash
# Gateway health
curl http://localhost:3000/api/health

# Python service health
curl http://localhost:8000/health

# Full service status
curl http://localhost:3000/api/v1/service-health
```

---

## Troubleshooting

### Docker Compose Issues

**Problem: "Port already in use"**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"
```

**Problem: Services won't start**
```bash
# Check logs
docker-compose -f docker/docker-compose.yml logs

# Restart services
docker-compose -f docker/docker-compose.yml restart

# Full rebuild
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml up -d
```

### Direct Installation Issues

**Problem: MongoDB won't connect**
```bash
# Verify MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Check connection string has correct username/password
MONGODB_URL=mongodb://admin:password@localhost:27017/nitte_merch_shop?authSource=admin
```

**Problem: npm install fails**
```bash
# Clear cache and retry
npm cache clean --force
npm install --legacy-peer-deps
```

**Problem: Python venv issues**
```bash
# On Windows, use full path:
C:\Python311\python.exe -m venv venv

# Delete venv and recreate
rm -rf venv  # or rmdir venv /s on Windows
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
```

### Kubernetes Issues

**Problem: Pods stuck in "Pending"**
```bash
# Check pod status
kubectl describe pod <pod-name> -n nitte-merch

# Usually means not enough resources or image can't be pulled
```

**Problem: CrashLoopBackOff**
```bash
# Check logs
kubectl logs <pod-name> -n nitte-merch --previous

# Usually wrong environment variables or connection issues
```

**Problem: Service unreachable**
```bash
# Port forward to test
kubectl port-forward -n nitte-merch svc/node-backend 3000:3000

# Test from another terminal
curl http://localhost:3000/api/health
```

---

## Summary

| Option | Time | Difficulty | Best For |
|--------|------|-----------|----------|
| Docker Compose | 5 mins | Easy | Quick local testing |
| Direct Install | 15 mins | Medium | Learning, debugging |
| Kubernetes | 20 mins | Hard | Production simulation |
| Jenkins | 30 mins | Hard | Full CI/CD automation |

---

**You're all set! Choose an option and follow the steps.** 

Need help with any specific step? Ask away!
