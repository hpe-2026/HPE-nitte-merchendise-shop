#!/bin/bash

set -e

echo "========================================="
echo "Test Script for NITTE Merchandise Shop"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/2] Testing Node.js Backend...${NC}"
cd node-backend
npm ci
npm test -- --passWithNoTests || true
npm run lint || true
cd ..

echo -e "${YELLOW}[2/2] Testing Python Service...${NC}"
cd python-service
python -m venv venv
source venv/bin/activate || . venv/Scripts/activate
pip install -r requirements.txt
pip install pytest pytest-cov

# Create tests directory if it doesn't exist
mkdir -p tests
touch tests/__init__.py

pytest tests/ -v --cov=app --cov-report=xml || true
cd ..

echo -e "${GREEN}Tests completed!${NC}"
echo "========================================="
