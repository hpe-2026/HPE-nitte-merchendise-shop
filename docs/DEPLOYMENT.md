# NITTE Merchandise Shop - Deployment Guide

## Prerequisites

### For Local Development
- Docker Desktop or Docker Engine with Docker Compose
- Node.js 18+
- Python 3.9+
- Git

### For Kubernetes Deployment
- Kubernetes cluster (1.24+)
- kubectl CLI configured
- Helm 3+ (optional but recommended)
- Access to container registry (Docker Hub, ECR, or similar)

### For Jenkins CI/CD
- Jenkins server (2.387+)
- Jenkins plugins: Git, Docker Pipeline, Kubernetes Plugin, Email Extension
- Access to container registry credentials
- kubeconfig for Kubernetes cluster access

## Local Development Setup

### Using Docker Compose

```bash
# Clone the repository
git clone https://github.com/nitte-dev/nitte-merch-shop.git
cd nitte-merch-shop

# Create environment files
cp node-backend/.env.example node-backend/.env
cp python-service/.env.example python-service/.env

# Edit environment files if needed
vim node-backend/.env
vim python-service/.env

# Start all services
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop services
docker-compose -f docker/docker-compose.yml down

# Clean up volumes
docker-compose -f docker/docker-compose.yml down -v
```

### Using Direct Installation

#### Node.js Backend

```bash
cd node-backend
npm install
cp .env.example .env

# For development
npm run dev

# For production
npm start
```

#### Python Service

```bash
cd python-service
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# For development
python -m uvicorn app.main:app --reload --port 8000

# For production
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### MongoDB

```bash
# Using Docker
docker run -d \
  --name nitte-mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7.0-alpine

# Using local MongoDB installation
mongod --dbpath ./data
```

## Building Docker Images

```bash
# Build Node.js backend
docker build -t nitte-merch-shop/node-backend:latest -f node-backend/Dockerfile node-backend/

# Build Python service
docker build -t nitte-merch-shop/python-service:latest -f python-service/Dockerfile python-service/

# Verify images
docker images | grep nitte-merch-shop
```

## Kubernetes Deployment

### Prerequisites

```bash
# Verify cluster access
kubectl cluster-info
kubectl get nodes

# Create kubeconfig
export KUBECONFIG=~/.kube/config
kubectl config view
```

### Option 1: Manual Deployment

```bash
# Create namespace
kubectl create namespace nitte-merch

# Deploy MongoDB
kubectl apply -f k8s/mongodb/statefulset.yaml

# Wait for MongoDB to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n nitte-merch --timeout=300s

# Deploy Python Service
kubectl apply -f k8s/python-service/deployment.yaml

# Deploy Node Backend
kubectl apply -f k8s/node-backend/deployment.yaml

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml

# Verify deployments
kubectl get deployments -n nitte-merch
kubectl get pods -n nitte-merch
kubectl get svc -n nitte-merch
```

### Option 2: Using Helm (Recommended)

```bash
# Create Helm chart (template provided)
helm install nitte-merch ./k8s/helm-chart \
  --namespace nitte-merch \
  --create-namespace \
  --values k8s/helm-chart/values.yaml
```

### Updating Deployments

```bash
# Update a specific image
kubectl set image deployment/node-backend \
  node-backend=nitte-merch-shop/node-backend:v2.0 \
  -n nitte-merch

# Check rollout status
kubectl rollout status deployment/node-backend -n nitte-merch

# Rollback if needed
kubectl rollout undo deployment/node-backend -n nitte-merch
```

## Jenkins CI/CD Pipeline Setup

### Prerequisites

1. Create Jenkins credentials:
   - Docker credentials (docker-credentials)
   - Kubeconfig file (kubeconfig)
   - Sonar token (sonar-token)

2. Install required Jenkins plugins:
   ```
   - Docker Pipeline
   - Kubernetes CLI
   - Git
   - Email Extension
   ```

### Pipeline Configuration

1. Create a new Multibranch Pipeline job
2. Configure source:
   - Repository: https://github.com/nitte-dev/nitte-merch-shop.git
   - Credentials: GitHub credentials

3. Build Configuration:
   - Source: Repository file
   - Script path: jenkins/Jenkinsfile

4. Scan trigger:
   - Periodic if not otherwise run
   - Interval: 1 hour

### Running the Pipeline

The pipeline automatically runs on:
- Push to main branch (production deployment)
- Push to develop branch (staging deployment)
- Pull requests (tests only)
- Manual trigger

### Pipeline Stages

1. **Checkout**: Clone repository
2. **Build & Test**: Build and test both services
3. **Code Quality**: SonarQube analysis
4. **Docker Build**: Build and push images
5. **Deploy to Staging**: Deploy to staging (develop branch)
6. **Deploy to Production**: Deploy to production (main branch, with approval)
7. **Smoke Tests**: Basic health checks
8. **Performance Tests**: Apache Bench load tests

## Environment Variables

### Node.js Backend

```env
NODE_ENV=development                    # or production
PORT=3000                               # Port to listen on
PYTHON_SERVICE_URL=http://localhost:8000
JWT_SECRET=your-secret-key              # Change in production!
JWT_EXPIRY=7d
MONGODB_URL=mongodb://localhost:27017/nitte_merch_shop
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
REQUEST_TIMEOUT=30000
```

### Python Service

```env
ENVIRONMENT=development                 # or production
PORT=8000
HOST=0.0.0.0
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=nitte_merch_shop
LOG_LEVEL=info
API_GATEWAY_URL=http://localhost:3000
```

## Scaling

### Horizontal Scaling

```bash
# Scale deployments
kubectl scale deployment/python-service \
  --replicas=5 \
  -n nitte-merch

kubectl scale deployment/node-backend \
  --replicas=5 \
  -n nitte-merch
```

### Auto-scaling

Auto-scaling is configured in k8s/ingress.yaml:
- Minimum replicas: 2
- Maximum replicas: 5
- CPU threshold: 80%
- Memory threshold: 80%

## Monitoring

### Health Checks

```bash
# Check API Gateway health
curl http://localhost:3000/api/health

# Check Python Service health
curl http://localhost:8000/health

# Check pod status
kubectl get pods -n nitte-merch
kubectl describe pod <pod-name> -n nitte-merch

# View logs
kubectl logs <pod-name> -n nitte-merch -f
```

### Prometheus Metrics (Future)

Metrics will be available at `/metrics` endpoint for both services.

## Backup and Recovery

### MongoDB Backup

```bash
# Manual backup
mongodump --uri="mongodb://admin:password@localhost:27017/nitte_merch_shop"

# Backup to S3 (with tools)
mongo-backup-to-s3 --bucket nitte-merch-backups
```

### Database Recovery

```bash
# Restore from dump
mongorestore --uri="mongodb://admin:password@localhost:27017" dump/
```

## Troubleshooting

### Common Issues

**Pod not starting**
```bash
# Check events
kubectl describe pod <pod-name> -n nitte-merch

# Check logs
kubectl logs <pod-name> -n nitte-merch

# Check resources
kubectl top pod <pod-name> -n nitte-merch
```

**Connection issues**
```bash
# Test connectivity between pods
kubectl exec -it <pod-name> -n nitte-merch -- ping python-service

# Check DNS resolution
kubectl run -it --image=busybox --restart=Never -- nslookup python-service.nitte-merch
```

**Database issues**
```bash
# Connect to MongoDB
kubectl exec -it mongodb-0 -n nitte-merch -- mongosh

# Check replica status
rs.status()
```

## Production Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Configure proper MongoDB authentication
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and alerting
- [ ] Configure backup and retention policies
- [ ] Set up logging aggregation
- [ ] Configure rate limiting thresholds
- [ ] Set up CI/CD pipeline
- [ ] Document runbook for operations team
- [ ] Plan disaster recovery procedure
- [ ] Set up automated security scanning
- [ ] Configure network policies
- [ ] Set up resource quotas and limits

## Disaster Recovery

### Backup Strategy

Daily automated backups:
- MongoDB data to S3/GCS
- Application configuration to version control
- Retention: 30 days

### Recovery Procedure

1. Restore MongoDB from backup
2. Redeploy application services
3. Run smoke tests
4. Verify data consistency
5. Monitor for errors

## Performance Optimization

### Database
- Create indexes on frequently queried fields 
- Use connection pooling 
- Implement caching layer (future)

### Application
- Enable gzip compression 
- Use CDN for static assets
- Implement request caching
- Optimize database queries

### Infrastructure
- Use HPA for auto-scaling 
- Configure resource requests/limits 
- Use node affinity for pod distribution 

## Additional Resources

- Kubernetes Documentation: https://kubernetes.io/docs/
- Docker Documentation: https://docs.docker.com/
- MongoDB Documentation: https://docs.mongodb.com/
- Express.js Documentation: https://expressjs.com/
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Jenkins Documentation: https://www.jenkins.io/doc/
