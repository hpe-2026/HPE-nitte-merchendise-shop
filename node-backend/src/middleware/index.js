import authService from '../services/authService.js';
import logger from '../config/logger.js';

const KEYCLOAK_REALM_URL = process.env.KEYCLOAK_REALM_URL || 'http://localhost:8081/realms/nitte-shop';

async function verifyKeycloakToken(token) {
  const { default: jwksRsa } = await import('jwks-rsa');
  const { default: jwt }     = await import('jsonwebtoken');
  const client = jwksRsa({ jwksUri: KEYCLOAK_REALM_URL + '/protocol/openid-connect/certs' });
  const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => callback(err, key?.getPublicKey()));
  };
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => err ? reject(err) : resolve(decoded));
  });
}

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No authorization token provided' });
    const token = authHeader.substring(7);
    // Block old insecure bypass
    if (token.startsWith('admin-token-')) return res.status(401).json({ success: false, message: 'Insecure token. Login via /api/v1/auth/admin/login' });
    try {
      const decoded = await verifyKeycloakToken(token);
      const roles = decoded.realm_access?.roles || [];
      const email = decoded.email || '';
      const isNITTEEmail = email.endsWith('@nmamit.in') || email.endsWith('@nitte.edu.in') || email.endsWith('@nitte.ac.in');
      req.user = { id: decoded.sub, email: decoded.email, name: decoded.name, role: roles.includes('admin') ? 'admin' : isNITTEEmail ? 'staff' : 'customer', userId: decoded.sub, source: 'keycloak', userType: isNITTEEmail ? 'internal' : 'external', groups: decoded.groups || [] };
      return next();
    } catch (_) {}
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    return next();
  } catch (error) {
    logger.error('Auth middleware error', { error: error.message });
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

export const staffOrAdminMiddleware = (req, res, next) => {
  if (!req.user || !['admin', 'staff'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Staff or admin access required' });
  next();
};

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path, method: req.method });
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal server error', error: process.env.NODE_ENV === 'development' ? err.stack : undefined });
};

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => logger.info(req.method + ' ' + req.path + ' - ' + res.statusCode + ' (' + (Date.now() - startTime) + 'ms)'));
  next();
};