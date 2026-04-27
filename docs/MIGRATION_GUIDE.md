# Database Migration Guide

## Overview

This guide explains how to manage database migrations and schema changes in the NITTE Merchandise Shop.

Since MongoDB is schema-less, we use **data validation at the application level** (Pydantic for Python, validation middleware for Node.js) rather than strict schema migrations.

## Migration Strategies

### Strategy 1: Add New Fields (No Breaking Changes)

**Example**: Add `tags` field to products

#### Step 1: Update Python Model
```python
# python-service/app/api/models.py
class Product(BaseModel):
    # ... existing fields ...
    tags: Optional[List[str]] = None  # New optional field
```

#### Step 2: Update Node.js Routes
```javascript
// node-backend/src/routes/products.js
const product = {
    // ... existing fields ...
    tags: req.body.tags || []
}
```

#### Step 3: Deploy
- No data migration needed (existing documents won't have field)
- New documents will include tags
- Application handles missing field gracefully

### Strategy 2: Rename Field (Backward Compatible)

**Example**: Rename `product_id` to `sku`

#### Migration Script
```javascript
// database/migrations/001_rename_product_id_to_sku.js
db = db.getSiblingDB('nitte_merch_shop');

// Add new field with old value
db.products.updateMany(
    { product_id: { $exists: true } },
    [
        { $addFields: { sku: "$product_id" } }
    ]
);

// Keep old field for compatibility (transition period)
console.log('Migration: product_id renamed to sku');
```

#### Run Migration
```bash
mongosh nitte_merch_shop database/migrations/001_rename_product_id_to_sku.js
```

#### Update Code Gradually
- Update Node.js to accept both `product_id` and `sku`
- Update Python to use `sku`
- After deployment period, remove `product_id` support

### Strategy 3: Change Data Type (Breaking Change)

**Example**: Convert `price` from string to number

#### Migration Script
```javascript
db = db.getSiblingDB('nitte_merch_shop');

// Convert string prices to numbers
db.products.updateMany(
    { price: { $type: "string" } },
    [
        { $set: { price: { $toDouble: "$price" } } }
    ]
);

console.log('Migration: Converted price to numeric type');
```

#### Deployment Plan
1. Deploy code that handles both string and number
2. Run migration during maintenance window
3. Verify all documents migrated
4. Update code to expect only numbers

## Running Migrations

### Manual Migration

```bash
cd database/migrations

# Run specific migration
mongosh nitte_merch_shop 001_rename_product_id_to_sku.js

# Run all migrations in order
for file in *.js; do
    mongosh nitte_merch_shop "$file"
done
```

### Docker-based Migration

```bash
docker-compose -f docker/docker-compose.yml exec mongodb \
    mongosh -u admin -p password \
    nitte_merch_shop /docker-entrypoint-initdb.d/migrations/001_rename_product_id_to_sku.js
```

### Kubernetes Migration

```bash
kubectl exec -it mongodb-0 -n nitte-merch -- \
    mongosh nitte_merch_shop < database/migrations/001_rename_product_id_to_sku.js
```

## Migration Best Practices

### 1. Always Backup First
```bash
# Backup before migration
mongodump --uri="mongodb://admin:password@localhost:27017/nitte_merch_shop" \
    --out=backup-$(date +%Y%m%d)

# Verify backup
ls -la backup-20240101/
```

### 2. Test Migrations Locally
```bash
# Start test environment
docker-compose -f docker/docker-compose.yml up -d

# Run migration
mongosh nitte_merch_shop < database/migrations/001_rename_product_id_to_sku.js

# Verify results
mongosh nitte_merch_shop
> db.products.findOne()

# Test application
curl http://localhost:3000/api/v1/products
```

### 3. Gradual Rollout
- Deploy code changes first
- Run migration during low-traffic period
- Monitor logs for errors
- Rollback if issues found

### 4. Document All Changes
```
# Migration Template: database/migrations/NNN_description.js

/**
 * Migration: Description of change
 * Date: YYYY-MM-DD
 * Author: Name
 * Breaking: Yes/No
 *
 * Changes:
 * - What changed
 * - Why changed
 * - Rollback procedure
 */

db = db.getSiblingDB('nitte_merch_shop');

// Migration script here

console.log('Migration completed');
```

## Common Migration Examples

### Add Index
```javascript
db.products.createIndex({ category: 1, price: 1 });
```

### Archive Old Data
```javascript
db.products_archive.insertMany(
    db.products.find({ created_at: { $lt: new Date('2024-01-01') } }).toArray()
);
db.products.deleteMany({ created_at: { $lt: new Date('2024-01-01') } });
```

### Add Calculated Field
```javascript
db.orders.updateMany(
    { total: { $exists: false } },
    [
        {
            $set: {
                total: {
                    $sum: {
                        $map: {
                            input: "$items",
                            as: "item",
                            in: { $multiply: ["$$item.quantity", "$$item.price"] }
                        }
                    }
                }
            }
        }
    ]
);
```

### Update Arrays
```javascript
db.orders.updateMany(
    { "items.quantity": { $lt: 0 } },
    [
        {
            $set: {
                items: {
                    $filter: {
                        input: "$items",
                        as: "item",
                        cond: { $gte: ["$$item.quantity", 0] }
                    }
                }
            }
        }
    ]
);
```

## Rollback Procedure

### From Backup
```bash
# Stop application
docker-compose -f docker/docker-compose.yml stop

# Restore database
mongorestore --uri="mongodb://admin:password@localhost:27017" \
    backup-20240101/

# Restart application
docker-compose -f docker/docker-compose.yml start
```

### Reverse Migration
```javascript
// database/migrations/001_rename_product_id_to_sku_rollback.js
db = db.getSiblingDB('nitte_merch_shop');

// Restore old field
db.products.updateMany(
    { sku: { $exists: true } },
    [
        { $addFields: { product_id: "$sku" } }
    ]
);

// Remove new field
db.products.updateMany({}, { $unset: { sku: "" } });
```

## Monitoring Migrations

### Check Migration Status
```bash
mongosh nitte_merch_shop
> db.products.stats()
> db.orders.stats()
> db.users.stats()
```

### Verify Data Integrity
```bash
mongosh nitte_merch_shop

# Check for null/missing fields
> db.products.find({ name: null })
> db.products.find({ price: { $exists: false } })

# Check data counts
> db.products.countDocuments()
> db.orders.countDocuments()
```

## CI/CD Integration

### Pre-deployment Checks
```bash
# docker/docker-compose.yml can include migration service
migrate:
  image: mongo:7.0
  depends_on:
    - mongodb
  entrypoint: >
    bash -c '
    mongosh mongodb:27017 nitte_merch_shop \
    < database/migrations/001_rename_product_id_to_sku.js
    '
  networks:
    - nitte-network
```

### Jenkins Pipeline Migration Step
```groovy
stage('Migrate Database') {
    steps {
        sh '''
            kubectl exec -it mongodb-0 -n nitte-merch -- \
                mongosh nitte_merch_shop < database/migrations/*
        '''
    }
}
```

## Troubleshooting Migrations

### Migration Stuck
```bash
# Check running operations
mongosh nitte_merch_shop
> db.currentOp()

# Kill long-running operation
> db.killOp(1234567890)
```

### Data Corruption
```bash
# Restore from backup
mongorestore --drop --uri="mongodb://admin:password@localhost:27017" backup/

# Re-run migration
mongosh nitte_merch_shop < database/migrations/001_rename_product_id_to_sku.js
```

### Performance Issues
```bash
# Run migration with lower priority
# Use MongoDB's built-in replication to handle heavy migrations

# Monitor progress
db.currentOp({ "command.update": { $exists: true } })
```

## Summary

- MongoDB allows flexible schema evolution
- Deploy code changes before running migrations
- Always backup before migrations
- Test thoroughly in development
- Document all changes
- Monitor and verify results
- Keep rollback procedures ready

For more info: https://docs.mongodb.com/manual/reference/method/db.collection.updateMany/
