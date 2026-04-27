# Complete Setup Guide: NITTE Merchandise Shop with Docker, Kubernetes, Jenkins, Prometheus & Jaeger

## Overview
This guide covers setting up the complete microservices stack with:
-  **Docker & Docker Compose** - Containerization
-  **Kubernetes** - Orchestration (with 2+ replicas, HPA, Ingress)
-  **Jenkins** - CI/CD Pipeline
-  **Prometheus** - Metrics collection
-  **Grafana** - Visualization
-  **Jaeger** - Distributed tracing
-  **AlertManager** - Alert handling

---

## Part 1: Docker Compose (Already Running )

### Current Status
- **Node.js API Gateway** (port 3000) -  Running & Healthy
- **Python FastAPI Service** (port 8000) -  Running & Healthy  
- **MongoDB** (port 27017) -  Running
- **Docker Network** -  nitte-network

### Verify Status
```bash
cd /home/languid/Downloads/HPE-task-2
docker compose -f docker/docker-compose.yml ps
docker logs nitte-node-backend | tail -10
docker logs nitte-python-service | tail -10
```

### Test APIs
```bash
# Node.js API Gateway health
curl http://localhost:3000/api/health

# Python service health
curl http://localhost:8000/health

# Get products (empty initially)
curl http://localhost:3000/api/products
```

---

## Part 2: Monitoring Stack (Prometheus, Grafana, Jaeger)

### Step 1: Update Node.js Backend for Prometheus Metrics

Add metrics endpoint to [node-backend/src/index.js](../node-backend/src/index.js):

```javascript
import promClient from 'prom-client';

// Register default metrics
promClient.collectDefaultMetrics();

// Create custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

// Add metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});
```

### Step 2: Update Python Service for Prometheus Metrics

Add to [python-service/app/main.py](../python-service/app/main.py):

```python
from prometheus_client import Counter, Histogram, generate_latest
import time

# Create metrics
request_count = Counter('python_requests_total', 'Total requests', ['method', 'endpoint'])
request_duration = Histogram('python_request_duration_seconds', 'Request duration', ['method', 'endpoint'])

# Metrics middleware
@app.middleware("http")
async def add_metrics(request: Request, call_next):
    request_count.labels(method=request.method, endpoint=request.url.path).inc()
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    request_duration.labels(method=request.method, endpoint=request.url.path).observe(duration)
    return response

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

### Step 3: Start Monitoring Stack

```bash
cd /home/languid/Downloads/HPE-task-2

# Start monitoring services (Prometheus, Grafana, Jaeger)
docker compose -f monitoring/docker-compose-monitoring.yml up -d

# Verify all services are running
docker compose -f monitoring/docker-compose-monitoring.yml ps
```

### Step 4: Access Monitoring Dashboards

| Service | URL | Credentials |
|---------|-----|-------------|
| **Prometheus** | http://localhost:9090 | (no auth) |
| **Grafana** | http://localhost:3001 | admin / admin |
| **Jaeger** | http://localhost:16686 | (no auth) |
| **AlertManager** | http://localhost:9093 | (no auth) |

### Step 5: Configure Grafana Dashboards

1. Open http://localhost:3001
2. Login with admin/admin
3. Add Prometheus as data source:
   - Settings -> Data Sources -> Add -> Prometheus
   - URL: http://prometheus:9090
   - Save & Test

4. Import stock dashboards:
   - Dashboards -> Import -> ID: 1860 (Node Exporter)
   - Dashboards -> Import -> ID: 3662 (Prometheus Stats)

---

## Part 3: Kubernetes Deployment

### Prerequisites
```bash
# Check if Minikube is installed
minikube version

# If not installed:
curl -LO https://github.com/kubernetes/minikube/releases/download/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start --memory=4096 --cpus=2

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server
```

### Step 1: Create Kubernetes Namespace

```bash
kubectl create namespace nitte-merch
kubectl get namespaces
```

### Step 2: Load Docker Images into Minikube

```bash
# Build images (if not done yet)
cd /home/languid/Downloads/HPE-task-2
docker compose -f docker/docker-compose.yml build

# Load images into Minikube
minikube image load docker-node-backend:latest
minikube image load docker-python-service:latest
minikube image load mongo:7.0

# Or set Docker environment to Minikube
eval $(minikube docker-env)
docker compose -f docker/docker-compose.yml build
```

### Step 3: Create Secrets

```bash
# Create MongoDB password secret
kubectl create secret generic app-secrets \
    --from-literal=MONGODB_PASSWORD=password \
    -n nitte-merch

# Verify
kubectl get secrets -n nitte-merch
```

### Step 4: Deploy Full Application Stack

```bash
# Deploy all components
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/full-deployment.yaml

# Verify deployment
kubectl get all -n nitte-merch
kubectl get pods -n nitte-merch -w  # Watch until all Running

# Check logs
kubectl logs -n nitte-merch -l app=node-backend --tail=50
kubectl logs -n nitte-merch -l app=python-service --tail=50
```

### Step 5: Access Services

```bash
# Port forward to access services locally
kubectl port-forward svc/node-backend 3000:3000 -n nitte-merch &
kubectl port-forward svc/python-service 8000:8000 -n nitte-merch &

# Test APIs
curl http://localhost:3000/api/health
curl http://localhost:8000/health

# Get Minikube IP for external access
minikube ip
# Add to /etc/hosts:
# <minikube-ip> api.nitte-merch.local python.nitte-merch.local
```

### Step 6: Scaling Services

```bash
# Manual scaling
kubectl scale deployment python-service --replicas=3 -n nitte-merch
kubectl scale deployment node-backend --replicas=3 -n nitte-merch

# Check HPA status
kubectl get hpa -n nitte-merch
kubectl metrics deployment python-service -n nitte-merch

# Generate load to trigger autoscaling
kubectl run -it --rm load-generator --image=busybox /bin/sh
# Inside pod: while sleep 0.01; do wget -q -O- http://node-backend:3000/api/products; done
```

### Step 7: Deploy Monitoring to Kubernetes

```bash
# Create Prometheus deployment in Kubernetes
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: nitte-merch
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - nitte-merch
EOF

# Deploy Prometheus
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: nitte-merch
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: nitte-merch
spec:
  selector:
    app: prometheus
  ports:
  - port: 9090
    targetPort: 9090
  type: ClusterIP
EOF
```

---

## Part 4: Jenkins CI/CD Pipeline

### Step 1: Start Jenkins

```bash
cd /home/languid/Downloads/HPE-task-2/jenkins

# Build and start Jenkins
docker compose -f docker-compose-jenkins.yml build
docker compose -f docker-compose-jenkins.yml up -d

# Wait for Jenkins to start
sleep 30

# Check status
docker compose -f docker-compose-jenkins.yml logs -f jenkins

# Get initial admin password
docker exec nitte-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### Step 2: Configure Jenkins

1. Open http://localhost:8080
2. Paste the admin password
3. Install suggested plugins
4. Create admin user
5. Configure Jenkins URL: http://localhost:8080

### Step 3: Add Credentials

**Docker Registry Credentials:**
1. Manage Jenkins -> Credentials -> System -> Global credentials
2. Add Credentials -> Username with password
   - Username: (your Docker Hub username)
   - Password: (your Docker Hub access token)
   - ID: docker-credentials

**Kubernetes Config:**
1. Add Credentials -> Secret file
   - File: (your ~/.kube/config)
   - ID: kubeconfig

**GitHub Token (optional):**
1. Add Credentials -> Secret text
   - Secret: (your GitHub personal access token)
   - ID: github-token

### Step 4: Create Pipeline Job

1. New Item -> Multibranch Pipeline
2. Name: NITTE-Merchandise-Shop
3. Branch Sources -> GitHub -> Repository: nitte-dev/nitte-merch-shop
4. Build Configuration:
   - Mode: by Jenkinsfile
   - Script Path: jenkins/Jenkinsfile-complete
5. Save

### Step 5: Trigger Build

```bash
# Manually trigger
# Go to Jenkins UI -> NITTE-Merchandise-Shop -> Scan Repository Now

# Or trigger via Git webhook (in your repository settings)
```

### Step 6: Monitor Build

- View build logs
- Check build artifacts
- Monitor deployment to Kubernetes
- View post-build notifications

---

## Part 5: Complete Workflow

### Development Workflow

```bash
# 1. Make code changes
cd /home/languid/Downloads/HPE-task-2
# Edit source files

# 2. Test locally with Docker Compose
docker compose -f docker/docker-compose.yml up -d
curl http://localhost:3000/api/health

# 3. Commit and push
git add .
git commit -m "Feature: Add new endpoint"
git push origin feature/new-endpoint

# 4. Jenkins automatically:
#    - Builds Docker images
#    - Runs tests
#    - Pushes to registry
#    - Deploys to Kubernetes

# 5. Monitor in Grafana
# - http://localhost:3001 (Docker) or k8s proxy

# 6. Check traces in Jaeger
# - http://localhost:16686
```

### Production Deployment

```bash
# 1. Tag release
git tag v1.0.0
git push origin v1.0.0

# 2. Jenkins builds and deploys to production namespace
# 3. Monitor with:
#    - Prometheus metrics
#    - Grafana dashboards
#    - Jaeger traces
#    - AlertManager alerts

# 4. Scale as needed
kubectl scale deployment python-service --replicas=5 -n nitte-merch
```

---

## Part 6: Troubleshooting

### Docker Issues
```bash
# View logs
docker logs nitte-node-backend
docker logs nitte-python-service
docker logs nitte-mongodb

# Restart services
docker compose -f docker/docker-compose.yml restart

# Force rebuild
docker compose -f docker/docker-compose.yml build --no-cache
```

### Kubernetes Issues
```bash
# Check pod status
kubectl get pods -n nitte-merch
kubectl describe pod <pod-name> -n nitte-merch

# View logs
kubectl logs -n nitte-merch <pod-name>

# Check resource usage
kubectl top pods -n nitte-merch

# Get events
kubectl get events -n nitte-merch --sort-by='.lastTimestamp'
```

### Jenkins Issues
```bash
# Check Jenkins logs
docker logs nitte-jenkins

# Restart Jenkins
docker compose -f jenkins/docker-compose-jenkins.yml restart

# Check console output
# Go to Jenkins UI -> Job -> Build -> Console Output
```

---

## Part 7: Cleanup

### Stop All Services
```bash
# Stop Docker Compose
cd /home/languid/Downloads/HPE-task-2
docker compose -f docker/docker-compose.yml down
docker compose -f monitoring/docker-compose-monitoring.yml down
docker compose -f jenkins/docker-compose-jenkins.yml down

# Delete Kubernetes resources
kubectl delete namespace nitte-merch

# Stop Minikube
minikube stop
minikube delete
```

---

## Summary of Ports

| Service | Port | URL |
|---------|------|-----|
| Node.js API Gateway | 3000 | http://localhost:3000 |
| Python FastAPI | 8000 | http://localhost:8000 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Prometheus | 9090 | http://localhost:9090 |
| Grafana | 3001 | http://localhost:3001 |
| Jaeger UI | 16686 | http://localhost:16686 |
| AlertManager | 9093 | http://localhost:9093 |
| Jenkins | 8080 | http://localhost:8080 |
| Node Exporter | 9100 | http://localhost:9100 |

---

## Next Steps

1.  Docker Compose is running - All three services operational
2. 📊 Start monitoring stack: `docker compose -f monitoring/docker-compose-monitoring.yml up -d`
3. ☸️ Deploy to Kubernetes: Follow Part 3 above
4. 🔄 Setup Jenkins CI/CD: Follow Part 4 above
5. 📈 Configure Grafana dashboards
6. 🔔 Setup AlertManager notifications
7.  Configure Jaeger tracing

---

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
