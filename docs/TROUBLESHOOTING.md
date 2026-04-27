# NITTE Merchandise Shop - Troubleshooting Guide

## Common Issues and Solutions

### Docker Compose Issues

#### Issue: Port already in use

**Problem**: `bind: address already in use`

**Solution**:
```bash
# Find and kill the process using the port
# For port 3000 (Node.js)
lsof -i :3000
kill -9 <PID>

# Or change the port in docker-compose.yml
ports:
  - "3001:3000"  # Changed from 3000:3000

# Or use Docker to stop conflicting containers
docker ps
docker stop <container-id>
```

#### Issue: Out of memory

**Problem**: `OOMKilled` or memory pressure

**Solution**:
```bash
# Increase Docker maximum memory
# Edit Docker Desktop settings or daemon.json

# Check current memory usage
docker stats

# Limit service memory in docker-compose.yml
services:
  python-service:
    deploy:
      resources:
        limits:
          memory: 1G
```

#### Issue: MongoDB won't connect

**Problem**: `MongooseError: Cannot connect to mongodb://localhost`

**Solution**:
```bash
# Verify MongoDB is running
docker-compose ps

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string in .env file
MONGODB_URL=mongodb://admin:password@mongodb:27017/nitte_merch_shop?authSource=admin

# For Docker Compose, use service name instead of localhost
MONGODB_URL=mongodb://admin:password@mongodb:27017/...
```

### Node.js Issues

#### Issue: npm dependencies fail to install

**Problem**: `npm ERR! code ERESOLVE`

**Solution**:
```bash
cd node-backend

# Clear npm cache
npm cache clean --force

# Install with legacy peer deps
npm install --legacy-peer-deps

# Or use npm 7+ with force
npm install --force
```

#### Issue: Port 3000 already in use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
# Linux/macOS
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows (PowerShell)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

#### Issue: JWT token invalid

**Problem**: `Invalid or expired token`

**Solution**:
```bash
# Check token expiry
node -e "console.log(require('jsonwebtoken').decode(token))"

# Verify JWT_SECRET in .env matches
JWT_SECRET=your-secret-key

# Refresh the token
POST /api/v1/auth/refresh
{
  "refresh_token": "..."
}

# Check token hasn't been revoked
# (implement token blacklist if needed)
```

#### Issue: Cannot call Python service

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:8000`

**Solution**:
```bash
# Verify Python service is running
curl http://localhost:8000/health

# Check PYTHON_SERVICE_URL environment variable
PYTHON_SERVICE_URL=http://localhost:8000

# For Docker Compose, use service name
PYTHON_SERVICE_URL=http://python-service:8000

# Check service is healthy
docker-compose logs python-service
```

### Python Service Issues

#### Issue: Python venv not activating

**Problem**: `command not found: python` on Windows

**Solution**:
```bash
# Use full path to Python
C:\path\to\python -m venv venv

# Or use Python 3 explicitly
python3 -m venv venv

# Activate venv
# Windows
venv\Scripts\activate

# Linux/macOS
source venv/bin/activate
```

#### Issue: Module import errors

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
# Ensure venv is activated
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install requirements
pip install -r requirements.txt

# Verify installation
pip list | grep fastapi
```

#### Issue: Async event loop errors

**Problem**: `RuntimeError: no running event loop`

**Solution**:
```python
# Use async properly in tests
import asyncio

async def test_something():
    result = await some_async_function()
    assert result

# Run with pytest-asyncio
# Install: pip install pytest-asyncio
# Mark test: @pytest.mark.asyncio
```

#### Issue: MongoDB connection timeout

**Problem**: `pymongo.errors.ServerSelectionTimeoutError`

**Solution**:
```bash
# Check MongoDB is running
docker-compose logs mongodb

# Verify connection string
MONGODB_URL=mongodb://admin:password@mongodb:27017?authSource=admin

# Increase timeout
MONGODB_URL=mongodb://admin:password@mongodb:27017?serverSelectionTimeoutMS=5000

# Test direct connection
mongosh "mongodb://admin:password@localhost:27017"
```

### Kubernetes Issues

#### Issue: Pod in CrashLoopBackOff

**Problem**: Pod keeps restarting

**Solution**:
```bash
# Check pod status and events
kubectl describe pod <pod-name> -n nitte-merch

# View logs
kubectl logs <pod-name> -n nitte-merch --tail=100
kubectl logs <pod-name> -n nitte-merch --previous  # If crashed

# Common causes:
# 1. Image not found - check image name
# 2. Port already in use
# 3. Missing environment variables
# 4. Database connection failure

# Fix and redeploy
kubectl delete pod <pod-name> -n nitte-merch
kubectl apply -f k8s/node-backend/deployment.yaml
```

#### Issue: Service unreachable

**Problem**: `Connection refused` or `timeout`

**Solution**:
```bash
# Check service exists
kubectl get svc -n nitte-merch

# Test connectivity from another pod
kubectl run -it --image=busybox --restart=Never -- \
  sh -c "curl http://python-service:8000/health"

# Check network policies
kubectl get networkpolicies -n nitte-merch

# Check ingress configuration
kubectl get ingress -n nitte-merch
kubectl describe ingress nitte-merch-ingress -n nitte-merch
```

#### Issue: Persistent volume not mounting

**Problem**: `FailedMount` error

**Solution**:
```bash
# Check PVC status
kubectl get pvc -n nitte-merch
kubectl describe pvc mongodb-pvc-0 -n nitte-merch

# Check if storage class exists
kubectl get storageclass

# Create if missing
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/host-path
EOF

# Delete and recreate pod
kubectl delete pod mongodb-0 -n nitte-merch
```

#### Issue: Insufficient memory/CPU

**Problem**: `Insufficient memory` or `Insufficient cpu`

**Solution**:
```bash
# Check node resources
kubectl top nodes
kubectl describe nodes

# Check pod resource requests
kubectl get pods -n nitte-merch -o json | \
  jq '.items[] | {name: .metadata.name, resources: .spec.containers[].resources}'

# Reduce resource requests or add more nodes
kubectl patch deployment node-backend -n nitte-merch --type='json' \
  -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/resources/requests/memory", "value":"128Mi"}]'
```

### Database Issues

#### Issue: MongoDB won't start

**Problem**: `mongod couldn't start`

**Solution**:
```bash
# Check logs
docker-compose logs mongodb

# Verify permissions on data directory
ls -la mongodb_data/

# Check disk space
df -h

# Remove and recreate
docker-compose down -v
docker-compose up -d mongodb

# Wait for health check
docker-compose ps
```

#### Issue: Can't authenticate to MongoDB

**Problem**: `authentication failed`

**Solution**:
```bash
# Verify credentials in .env
MONGODB_URL=mongodb://username:password@host:27017

# Check if auth is enabled in MongoDB
mongosh --eval "db.getUser('admin')"

# Reset credentials if lost
# 1. Start MongoDB without auth
# 2. Create admin user
# 3. Restart with auth enabled
```

#### Issue: Collections not created

**Problem**: Empty database or missing collections

**Solution**:
```bash
# Manual initialization (if needed)
mongosh nitte_merch_shop <<EOF
db.createCollection('products');
db.createCollection('orders');
db.products.createIndex({ name: 1 });
db.products.createIndex({ category: 1 });
db.orders.createIndex({ user_id: 1 });
db.orders.createIndex({ order_id: 1 }, { unique: true });
EOF

# Insert sample data
mongosh nitte_merch_shop < database/init-scripts/init.js
```

### API Issues

#### Issue: Slow API responses

**Problem**: High latency and timeouts

**Solution**:
```bash
# Check database indexes
mongosh nitte_merch_shop
> db.products.getIndexes()

# Check query performance
> db.products.find({category: 'clothing'}).explain('executionStats')

# Check service logs
docker-compose logs python-service

# Monitor resource usage
docker stats
kubectl top pods -n nitte-merch

# Optimize queries or add caching
```

#### Issue: CORS errors

**Problem**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:
```bash
# Check CORS_ORIGIN in .env
CORS_ORIGIN=http://localhost:3000

# Update for production domain
CORS_ORIGIN=https://yourdomain.com

# Check headers in response
curl -i http://localhost:3000/api/v1/products

# Should include:
# Access-Control-Allow-Origin: http://localhost:3000
```

#### Issue: Rate limiting blocking requests

**Problem**: `429 Too Many Requests`

**Solution**:
```bash
# Check rate limit in node-backend/src/index.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100  // 100 requests
});

# Whitelist specific IPs
app.use('/api/', limiter);  // Apply to API only
app.use(express.static('public'));  // Not limited
```

## Debugging Techniques

### Enable Debug Logging

```bash
# Node.js
DEBUG=* npm run dev

# Python
LOG_LEVEL=debug python -m uvicorn app.main:app --reload

# Docker
docker-compose logs -f <service_name>
```

### Test Services Directly

```bash
# Test Node.js
curl http://localhost:3000/api/health

# Test Python
curl http://localhost:8000/health

# Test MongoDB
mongosh localhost:27017
> show dbs
```

### Use Network Debugging Tools

```bash
# Check port listeners
# Linux/macOS
lsof -i :3000
netstat -tlnp | grep 3000

# Windows
netstat -ano | findstr :3000

# Test network connectivity
ping google.com
curl https://www.google.com

# DNS resolution
nslookup python-service
dig python-service
```

## Getting Help

1. **Check logs first** - most issues are visible in logs
2. **Search documentation** - answers to common questions
3. **Check GitHub issues** - similar problems already reported
4. **Ask in community** - Stack Overflow, Discord, etc.
5. **File issue** - Include logs, environment, and reproduction steps

## Performance Troubleshooting

### High CPU Usage
- Check for infinite loops or heavy computations
- Monitor with `docker stats` or `kubectl top`
- Profile with Chrome DevTools (Node.js)

### High Memory Usage
- Check for memory leaks
- Monitor with `docker stats`
- Look for unbounded arrays or objects

### High Latency
- Check database indexes
- Monitor network with `nslookup` or `dig`
- Look for N+1 queries
- Check CPU and disk I/O

## Production Debugging

Always use:
- Structured logging
- Request IDs for tracing
- Monitoring and alerting
- Error tracking (Sentry, Rollbar)
- APM tools (New Relic, DataDog)
