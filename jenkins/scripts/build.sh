#!/bin/bash

set -e

echo "========================================="
echo "Build Script for NITTE Merchandise Shop"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/4] Building Node.js Backend...${NC}"
cd node-backend
npm ci --production
npm run build || echo "No build script found"
cd ..

echo -e "${YELLOW}[2/4] Building Python Service...${NC}"
cd python-service
python -m venv venv
source venv/bin/activate || . venv/Scripts/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo -e "${YELLOW}[3/4] Building Docker Images...${NC}"
docker build -t nitte-merch-shop/node-backend:latest -f node-backend/Dockerfile node-backend/
docker build -t nitte-merch-shop/python-service:latest -f python-service/Dockerfile python-service/

echo -e "${GREEN}[4/4] Build completed successfully!${NC}"
echo "========================================="
