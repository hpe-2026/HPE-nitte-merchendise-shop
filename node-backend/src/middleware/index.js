import authService from '../services/authService.js';
import logger from '../config/logger.js';
import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

// Keycloak JWKS client to verify Keycloak tokens
const keycloakClient = jwksClient({
  jwksUri: 'http://nitte-keycloak:8081/realms/nitte-shop/protocol/openid-connect/certs',
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000 // 10 minutes
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

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    const token = authHeader.substring(7);

    // Accept demo admin tokens for testing
    if (token.startsWith('admin-token-')) {
      req.user = {
        id: 'admin-user',
        email: 'admin@nitte.com',
        role: 'admin',
        userId: 'admin-user'
      };
      return next();
    }

    // First try Keycloak token validation
    try {
      const decoded = await verifyKeycloakToken(token);
      const roles = decoded.realm_access?.roles || [];
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        role: roles.includes('admin') ? 'admin'
            : roles.includes('staff') ? 'staff'
            : roles.includes('customer') ? 'customer'
            : 'user',
        userId: decoded.sub,
        source: 'keycloak',
        groups: decoded.groups || []
      };
      logger.info('Keycloak token verified', { email: decoded.email, role: req.user.role });
      return next();
    } catch (keycloakErr) {
      // Not a Keycloak token, try local JWT
      logger.debug('Not a Keycloak token, trying local JWT');
    }

    // Fall back to local JWT validation
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    return next();

  } catch (error) {
    logger.error('Authentication middleware error', { error: error.message });
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

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