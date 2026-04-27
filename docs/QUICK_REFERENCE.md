# ⚡ NITTE Merchandise Shop - Quick Reference Card

## 🎯 START HERE

### Option 1: Docker Compose (SIMPLEST - Do This First! )
```bash
cd c:\Users\Mahe\Desktop\HPE-task-2
docker-compose -f docker/docker-compose.yml up -d
curl http://localhost:3000/api/health
```
 Done in 5 minutes
 No installation needed (just Docker)
 Perfect for testing

---

### Option 2: Direct Installation (LOCAL DEVELOPMENT)
```bash
# Terminal 1: MongoDB
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin \
-e MONGO_INITDB_ROOT_PASSWORD=password mongo:7.0

# Terminal 2: Python
cd python-service && python -m venv venv
source venv/bin/activate && pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Terminal 3: Node.js
cd node-backend && npm install && npm run dev
```
 More control
 Better for development
 See real logs

---

### Option 3: Kubernetes (PRODUCTION LIKE)
```bash
kubectl create namespace nitte-merch
kubectl apply -f k8s/mongodb/statefulset.yaml
kubectl apply -f k8s/python-service/deployment.yaml
kubectl apply -f k8s/node-backend/deployment.yaml
```
 Production simulation
 Auto-scaling
 High availability

---

### Option 4: Jenkins CI/CD (FULL AUTOMATION)
```bash
1. Create Jenkins job (Multibranch Pipeline)
2. Point to: jenkins/Jenkinsfile
3. Click "Build Now"
4. Watch automation!
```
 Full pipeline
 Automated tests
 Auto-deployment

---

##  API Quick Test

### 1. Signup
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "pass123",
    "name": "Test User"
  }'
```

### 2. Save Token
```bash
# Copy access_token from response
export TOKEN="your_token_here"
```

### 3. Get Products
```bash
curl http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Create Order
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [{"product_id": "PRODUCT_ID", "quantity": 2}],
    "shipping_address": "123 Main St",
    "notes": "Fast delivery"
  }'
```

### 5. Health Check
```bash
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

---

## 📍 Service URLs

| Service | URL | Port | Status |
|---------|-----|------|--------|
| Node.js Gateway | http://localhost:3000 | 3000 |  |
| Python Service | http://localhost:8000 | 8000 |  |
| MongoDB | localhost:27017 | 27017 |  |
| Swagger Docs | http://localhost:8000/docs | - |  |

---

## 📂 Important Files

| File | Purpose | Read Time |
|------|---------|-----------|
| README.md | Overview | 5 min |
| QUICK_START.md | Choose method | 2 min |
| EXECUTION_TUTORIAL.md | Step-by-step | 15 min |
| docs/API_DOCUMENTATION.md | API details | 10 min |
| docs/ARCHITECTURE.md | System design | 10 min |
| docker/docker-compose.yml | Local setup | 2 min |
| k8s/*.yaml | Production | 5 min |
| jenkins/Jenkinsfile | CI/CD | 5 min |

---

## 🛠️ Common Commands

### Docker Compose
```bash
# Start
docker-compose -f docker/docker-compose.yml up -d

# Stop
docker-compose -f docker/docker-compose.yml down

# Logs
docker-compose -f docker/docker-compose.yml logs -f

# Rebuild
docker-compose -f docker/docker-compose.yml down -v && docker-compose -f docker/docker-compose.yml up -d
```

### Kubernetes
```bash
# Check pods
kubectl get pods -n nitte-merch

# Check logs
kubectl logs deploy/node-backend -n nitte-merch -f

# Port forward
kubectl port-forward -n nitte-merch svc/node-backend 3000:3000

# Delete all
kubectl delete namespace nitte-merch
```

### npm (Node)
```bash
npm install
npm run dev
npm test
npm run lint
```

### pip (Python)
```bash
pip install -r requirements.txt
pytest
python -m uvicorn app.main:app --reload
```

---

## ⚙️ Environment Variables

### Node Backend (.env)
```
NODE_ENV=development
PORT=3000
PYTHON_SERVICE_URL=http://localhost:8000
JWT_SECRET=your-secret-key
MONGODB_URL=mongodb://admin:password@localhost:27017/nitte_merch_shop?authSource=admin
```

### Python Service (.env)
```
ENVIRONMENT=development
PORT=8000
MONGODB_URL=mongodb://admin:password@localhost:27017/nitte_merch_shop?authSource=admin
DATABASE_NAME=nitte_merch_shop
```

---

## 🚨 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | `lsof -i :3000` then `kill -9 PID` |
| MongoDB won't connect | Check connection string in .env |
| Services won't start | `docker-compose down -v && docker-compose up -d` |
| npm install fails | `npm cache clean --force && npm install --legacy-peer-deps` |
| Python venv issue | `rm -rf venv && python -m venv venv` |
| Kubernetes pod stuck | `kubectl describe pod POD_NAME -n nitte-merch` |
| Services not talking | Check network in docker-compose.yml or k8s service names |

---

## 📊 API Endpoints (18 Total)

### Authentication (5)
```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### Products (5)
```
GET    /api/v1/products
GET    /api/v1/products/:id
POST   /api/v1/products (admin)
PUT    /api/v1/products/:id (admin)
DELETE /api/v1/products/:id (admin)
```

### Orders (5)
```
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders
PUT    /api/v1/orders/:id (admin)
```

### Health (3)
```
GET    /api/health
GET    /api/v1/service-health
GET    /health (Python)
```

---

## 🔐 Security Info

- **Auth**: JWT (7 day expiry)
- **Password**: bcryptjs hashing
- **Roles**: user, admin
- **Rate Limit**: 100 requests/15 min
- **CORS**: http://localhost:3000
- **Headers**: Helmet.js security

---

## 📦 Tech Stack

```
Backend:        Node.js, Express.js
Service:        Python, FastAPI
Database:       MongoDB
Container:      Docker
Orchestration:  Kubernetes
CI/CD:          Jenkins
Auth:           JWT
Validation:     Pydantic, express-validator
```

---

## 🎯 Success Checklist

Before you start, ensure:
- [ ] Docker installed (for Method 1)
- [ ] Node.js 18+ installed (for Method 2)
- [ ] Python 3.11+ installed (for Method 2)
- [ ] kubectl installed (for Method 3)
- [ ] 4GB+ RAM available
- [ ] Port 3000, 8000, 27017 free

---

## 📚 Reading Guide

**5 Minutes**: README.md + QUICK_START.md
**15 Minutes**: Choose method + EXECUTION_TUTORIAL.md
**30 Minutes**: Run system + test APIs
**1 Hour**: Read ARCHITECTURE.md + API_DOCUMENTATION.md

---

## 🎬 Sample Data Included

### Products (5 pre-loaded)
- NITTE Official T-Shirt ($499.99)
- NITTE College Bag ($1299.99)
- NITTE Water Bottle ($299.99)
- NITTE Hoodie ($799.99)
- NITTE Cap ($399.99)

### Create Sample Order
1. Get product IDs from `/api/v1/products`
2. Use a product ID in create order request
3. Data stored automatically in MongoDB

---

## 🔄 Deployment Timeline

| Method | Time | Difficulty |
|--------|------|-----------|
| Docker Compose | 5 min | * Easy |
| Direct Install | 15 min | ** Medium |
| Kubernetes | 20 min | *** Hard |
| Jenkins | 30 min | *** Hard |

---

## 📞 Need Help?

1. **Check**: QUICK_START.md
2. **Read**: EXECUTION_TUTORIAL.md
3. **Review**: docs/TROUBLESHOOTING.md
4. **Learn**: docs/ARCHITECTURE.md

---

## ✨ What's Included

 Complete Node.js API Gateway
 Complete Python Business Logic Service
 Complete MongoDB Setup
 Docker + Docker Compose
 Kubernetes Manifests
 Jenkins CI/CD Pipeline
 9 Documentation Files
 18 API Endpoints
 Sample Data
 Security Implementation
 Auto-scaling Setup
 Health Monitoring

---

##  Ready? Let's Go!

**Recommended Path:**
1. Read: README.md (5 min)
2. Choose: QUICK_START.md (2 min)
3. Execute: EXECUTION_TUTORIAL.md (5-30 min)
4. Test: curl commands (5 min)
5. Explore: docs/ folder (ongoing)

---

**Project Location**: `c:\Users\Mahe\Desktop\HPE-task-2\`

**Start Command (Method 1 - Easiest):**
```bash
cd c:\Users\Mahe\Desktop\HPE-task-2
docker-compose -f docker/docker-compose.yml up -d
```

**All done! You're ready to launch! 🎉**
