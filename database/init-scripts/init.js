db = db.getSiblingDB('nitte_merch_shop');

db.createCollection('products');
db.createCollection('orders');
db.createCollection('users');
db.createCollection('policies');

db.products.createIndex({ name: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ price: 1 });
db.orders.createIndex({ user_id: 1 });
db.orders.createIndex({ order_id: 1 }, { unique: true });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ created_at: -1 });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ status: 1 });
db.users.createIndex({ role: 1 });
db.policies.createIndex({ actions: 1, enabled: 1 });
db.policies.createIndex({ name: 1 }, { unique: true });

// Password hash for "Admin@123"
const ADMIN_HASH = '$2b$10$YIjlrPNoS0XtqYvvjHh1KOmktzxjSSZ.XVXp0o9weS4KR5bOKWkvO';

db.users.insertMany([
  { email: 'admin@nitte.edu.in', name: 'Admin User', password: ADMIN_HASH, role: 'admin', status: 'approved', created_at: new Date(), updated_at: new Date() },
  { email: 'supplier@test.com', name: 'Demo Supplier', password: ADMIN_HASH, role: 'supplier', status: 'approved', created_at: new Date(), updated_at: new Date() },
  { email: 'customer@test.com', name: 'Demo Customer', password: ADMIN_HASH, role: 'customer', status: 'approved', created_at: new Date(), updated_at: new Date() },
  { email: 'pending@test.com', name: 'Pending User', password: ADMIN_HASH, role: 'customer', status: 'pending', created_at: new Date(), updated_at: new Date() },
]);

db.products.insertMany([
  { name: 'NITTE Official T-Shirt', category: 'clothing', price: 3999, stock: 100, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300', created_at: new Date() },
  { name: 'NITTE College Bag', category: 'bags', price: 4999, stock: 50, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300', created_at: new Date() },
  { name: 'NITTE Water Bottle', category: 'accessories', price: 799, stock: 200, image_url: 'https://images.unsplash.com/photo-1602143407151-7e6a30e0f0f5?w=300', created_at: new Date() },
  { name: 'NITTE Hoodie', category: 'clothing', price: 2499, stock: 75, image_url: 'https://images.unsplash.com/photo-1556821552-7f41c5d440db?w=300', created_at: new Date() },
  { name: 'NITTE Cap', category: 'accessories', price: 699, stock: 150, image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=300', created_at: new Date() },
]);

print('✅ Database initialized');
print('   Admin:    admin@nitte.edu.in / Admin@123');
print('   Supplier: supplier@test.com / Admin@123');
print('   Customer: customer@test.com / Admin@123');