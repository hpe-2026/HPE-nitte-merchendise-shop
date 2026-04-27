# NITTE Merchandise Shop - System Architecture

## Overview

This document provides a detailed explanation of the system architecture for the NITTE Merchandise Shop backend system.

## Architecture Components

### 1. Frontend Client
- Web or Mobile application
- Communicates with API Gateway via HTTP/REST
- Requires authentication using JWT tokens

### 2. API Gateway (Node.js Express)
**Purpose**: Single entry point for all client requests

**Responsibilities**:
- Request routing and validation
- Authentication and authorization
- Rate limiting
- Request/response transformation
- Error handling
- Service orchestration

**Technology Stack**:
- Node.js 18+
- Express.js framework
- JWT for authentication
- MongoDB for user data and sessions
- Axios for inter-service communication

**Key Features**:
- CORS support
- Security headers with Helmet
- Input validation with express-validator
- Rate limiting with express-rate-limit
- Structured logging with Winston

### 3. Business Logic Service (Python FastAPI)
**Purpose**: Core business logic and data processing

**Responsibilities**:
- Product management operations
- Order processing and fulfillment
- Database operations
- Business rule enforcement
- Data validation

**Technology Stack**:
- Python 3.11+
- FastAPI framework
- Motor (async MongoDB driver)
- Pydantic for data validation
- Uvicorn ASGI server

**Key Features**:
- Async/await architecture for better performance
- Automatic API documentation with Swagger
- Data validation with Pydantic models
- Comprehensive error handling
- Database indexing for performance

### 4. Database (MongoDB)
**Purpose**: Primary data store

**Collections**:
- `products`: Product catalog
- `orders`: Customer orders
- `users`: User accounts (stored in Node backend)

**Features**:
- Indexes on frequently queried fields
- Replication support
- Authentication and authorization
- Automatic backups (in production)

## Service Communication

### Synchronous Communication
```
Client
   HTTP/REST
API Gateway (Node.js)
   HTTP Request
Business Service (Python)
   Query Language
MongoDB
```

### Request Flow Example

#### Get Products Request
1. Client sends: `GET /api/v1/products`
2. API Gateway receives request
3. API Gateway validates request
4. API Gateway calls: `GET http://python-service:8000/api/v1/products`
5. Python Service queries MongoDB: `db.products.find()`
6. Python Service returns data
7. API Gateway returns to client

#### Create Order Request
1. Client sends: `POST /api/v1/orders` with JWT token
2. API Gateway authenticates request
3. API Gateway validates order data
4. API Gateway calls: `POST http://python-service:8000/api/v1/orders`
5. Python Service validates items and prices
6. Python Service creates MongoDB document
7. Python Service returns order ID
8. API Gateway returns response with order details

## Data Models

### Product
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  price: Float,
  stock: Integer,
  image_url: String,
  created_at: DateTime,
  updated_at: DateTime
}
```

### Order
```javascript
{
  _id: ObjectId,
  order_id: String,           // ORD-UUID format
  user_id: String,            // Reference to user from Node.js
  user_email: String,
  items: [{
    product_id: String,
    quantity: Integer,
    price: Float
  }],
  shipping_address: String,
  notes: String,
  status: String,             // pending, confirmed, shipped, delivered
  created_at: DateTime,
  updated_at: DateTime
}
```

### User (Node.js MongoDB)
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,           // Hashed with bcryptjs
  name: String,
  role: String,               // user or admin
  created_at: DateTime,
  updated_at: DateTime
}
```

## Security Architecture

### Authentication
- JWT (JSON Web Tokens) for API authentication
- Access token valid for 7 days
- Refresh token valid for 30 days
- Tokens signed with HS256 algorithm

### Authorization
- Role-based access control (RBAC)
- Admin-only endpoints for product management
- User-specific order access
- Middleware-based enforcement

### Data Protection
- Password hashing with bcryptjs (salt rounds: 10)
- HTTPS in production
- MongoDB authentication enabled
- Environment-based secrets management

### Other Security Measures
- Rate limiting (100 requests per 15 minutes)
- Input validation on all endpoints
- CORS configured for safe origins
- Security headers with Helmet
- No sensitive data in logs

## Deployment Architecture

### Development
- Docker Compose for local development
- All services on localhost
- Mock/sample data in database
- Hot reload enabled for faster development

### Staging
- Kubernetes cluster with 2 replicas per service
- Development-grade resources
- MongoDB with persistence
- Ingress for routing

### Production
- Kubernetes cluster with 2-5 replicas per service
- Auto-scaling based on CPU/memory
- MongoDB StatefulSet with persistent volumes
- TLS/SSL certificates
- Monitoring and logging

## Performance Considerations

### Caching Strategy
- Application-level caching (future enhancement)
- Database indexing on:
  - Products: name, category, price
  - Orders: user_id, order_id, status, created_at

### Scalability
- Horizontal scaling via Kubernetes
- Load balancing through service discovery
- Stateless application design
- Async operations in Python service

### Database Optimization
- Connection pooling with Motor
- Indexed queries for fast lookups
- Pagination on list endpoints
- Aggregation pipeline support

## Monitoring and Observability

### Health Checks
- Liveness probes every 30 seconds
- Readiness probes every 10 seconds
- Service health endpoint at `/health`

### Logging
- Structured logging in JSON format
- Different log levels (info, debug, error)
- Log aggregation ready (ELK, Splunk, etc.)
- Correlation IDs for request tracking

### Metrics (Future)
- Prometheus metrics integration
- Request latency tracking
- Database query performance
- Service error rates

## Disaster Recovery

### Backup Strategy
- MongoDB backup jobs (daily)
- Version control for code
- Database snapshots before deployments

### Failover Strategy
- Pod Disruption Budgets (PDB) ensure minimum availability
- Multiple replicas across nodes
- Health checks enable automatic recovery

## Future Enhancements

1. **Message Queue**: Add RabbitMQ for async operations
2. **Cache Layer**: Redis for product caching
3. **API Gateway**: Kong or Nginx Ingress for advanced routing
4. **Service Mesh**: Istio for sophisticated traffic management
5. **Search**: Elasticsearch for advanced product search
6. **Real-time Updates**: WebSocket support
7. **GraphQL**: Alongside REST API
8. **API Versioning**: v2, v3 support without breaking changes

## Technology Justification

### Node.js for API Gateway
- Fast request handling
- JSON native support
- Rich middleware ecosystem
- Good for I/O-heavy operations

### Python for Business Logic
- Rapid development
- Excellent data processing libraries
- Strong async support with FastAPI
- Better for computational tasks

### MongoDB
- Flexible schema for merchandise data
- Good horizontal scale-out properties
- Document model fits our data structure
- Rich query language

### Kubernetes
- Industry-standard orchestration
- Auto-scaling and self-healing
- Multi-environment support
- Excellent ecosystem

### Docker
- Consistent environments across services
- Easy dependency management
- Lightweight compared to VMs
- Standard industry practice

## Conclusion

This architecture provides a scalable, maintainable, and secure foundation for the NITTE Merchandise Shop. The separation of concerns between gateway and business logic, combined with cloud-native deployment patterns, allows for independent scaling and maintenance of each component.
