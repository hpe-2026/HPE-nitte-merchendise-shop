#!/bin/bash

set -e

echo "========================================="
echo "Deploy Script for NITTE Merchandise Shop"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${KUBE_NAMESPACE:-nitte-merch}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-docker.io}
DOCKER_NAMESPACE=${DOCKER_NAMESPACE:-nitte-merch-shop}
BUILD_NUMBER=${BUILD_NUMBER:-latest}

NODE_BACKEND_IMAGE="${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/node-backend:${BUILD_NUMBER}"
PYTHON_SERVICE_IMAGE="${DOCKER_REGISTRY}/${DOCKER_NAMESPACE}/python-service:${BUILD_NUMBER}"

echo -e "${YELLOW}[1/5] Checking Kubernetes cluster...${NC}"
kubectl cluster-info
kubectl get nodes

echo -e "${YELLOW}[2/5] Creating namespace...${NC}"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

echo -e "${YELLOW}[3/5] Deploying services...${NC}"
# Apply MongoDB
kubectl apply -f k8s/mongodb/statefulset.yaml

# Wait for MongoDB
echo "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s || true
sleep 10

# Apply Python Service
kubectl apply -f k8s/python-service/deployment.yaml
kubectl set image deployment/python-service python-service=$PYTHON_SERVICE_IMAGE -n $NAMESPACE --record=true || true

# Apply Node Backend
kubectl apply -f k8s/node-backend/deployment.yaml
kubectl set image deployment/node-backend node-backend=$NODE_BACKEND_IMAGE -n $NAMESPACE --record=true || true

# Apply Ingress
kubectl apply -f k8s/ingress.yaml

echo -e "${YELLOW}[4/5] Waiting for deployments to be ready...${NC}"
kubectl rollout status deployment/python-service -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/node-backend -n $NAMESPACE --timeout=5m

echo -e "${YELLOW}[5/5] Checking deployment status...${NC}"
kubectl get deployments -n $NAMESPACE
kubectl get pods -n $NAMESPACE
kubectl get svc -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "========================================="
