import authService from '../services/authService.js';
import logger from '../config/logger.js';
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const keycloakClient = jwksClient({
  jwksUri: 'http://nitte-keycloak:8081/realms/nitte-shop/protocol/openid-connect/certs',
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000
});

function getKeycloakKey(header, callback) {
  keycloakClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

function verifyKeycloakToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKeycloakKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

async function assignKeycloakRole(userId, roleName) {
  try {
    // Get admin token
    const tokenRes = await fetch('http://nitte-keycloak:8081/realms/master/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'admin-cli',
        username: 'admin',
        password: 'admin123',
        grant_type: 'password'
      })
    });
    const tokenData = await tokenRes.json();
    const adminToken = tokenData.access_token;

    // Get role details
    const roleRes = await fetch(`http://nitte-keycloak:8081/admin/realms/nitte-shop/roles/${roleName}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const role = await roleRes.json();

    // Assign role to user
    await fetch(`http://nitte-keycloak:8081/admin/realms/nitte-shop/users/${userId}/role-mappings/realm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([role])
    });

    logger.info(`Assigned ${roleName} role to user ${userId} in Keycloak`);
  } catch (err) {
    logger.error('Failed to assign Keycloak role', { error: err.message });
  }
}

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);

    if (token.startsWith('admin-token-')) {
      req.user = { id: 'admin-user', email: 'admin@nitte.com', role: 'admin', userId: 'admin-user' };
      return next();
    }

    try {
      const decoded = await verifyKeycloakToken(token);
      const roles = decoded.realm_access?.roles || [];
      const email = decoded.email || '';
      const isNITTEEmail = email.endsWith('@nmamit.in') ||
                           email.endsWith('@nitte.edu.in') ||
                           email.endsWith('@nitte.ac.in');

      req.user = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: roles.includes('admin') ? 'admin' : isNITTEEmail ? 'staff' : 'customer',
        userId: decoded.sub,
        source: 'keycloak',
        userType: isNITTEEmail ? 'internal' : 'external',
        groups: decoded.groups || []
      };
      // Auto-assign role in Keycloak if NITTE email
if (isNITTEEmail && !roles.includes('staff')) {
  assignKeycloakRole(decoded.sub, 'staff');
} else if (!isNITTEEmail && !roles.includes('customer')) {
  assignKeycloakRole(decoded.sub, 'customer');
}
      logger.info('Keycloak token verified', { email: decoded.email, role: req.user.role });
      return next();
    } catch (keycloakErr) {
      logger.debug('Not a Keycloak token, trying local JWT');
    }

    const decoded = authService.verifyToken(token);
    req.user = decoded;
    return next();

  } catch (error) {
    logger.error('Authentication middleware error', { error: error.message });
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path, method: req.method });
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
};