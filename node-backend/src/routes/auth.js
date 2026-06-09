/**
 * auth.js — Authentication routes
 *
 * POST /api/v1/auth/signup        register as supplier or customer (status: pending)
 * POST /api/v1/auth/login          login (only approved accounts)
 * POST /api/v1/auth/admin/login    dedicated admin login
 * GET  /api/v1/auth/admin/registrations?status=pending
 * POST /api/v1/auth/admin/registrations/:id/approve
 * POST /api/v1/auth/admin/registrations/:id/deny
 * DELETE /api/v1/auth/admin/users/:id
 * POST /api/v1/auth/refresh
 * GET  /api/v1/auth/me
 * POST /api/v1/auth/logout
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import authService from '../services/authService.js';
import { authMiddleware, adminMiddleware } from '../middleware/index.js';
import logger from '../config/logger.js';
import { sendApprovalRequestEmail, sendLoginSuccessEmail, sendApprovalEmail } from '../services/emailService.js';

const router = express.Router();

const userSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:      { type: String, required: true, trim: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['admin', 'supplier', 'customer'], default: 'customer' },
  status:    { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export { User };

let authAttempts = { inc: () => {} };
try {
  const { Counter } = await import('prom-client');
  authAttempts = new Counter({
    name: 'auth_attempts_total',
    help: 'Total authentication attempts',
    labelNames: ['type', 'success'],
  });
} catch (_) {}

const signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').trim().notEmpty(),
  body('role').optional().isIn(['supplier', 'customer']),
];
const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

// POST /signup
router.post('/signup', signupValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { email, password, name, role = 'customer' } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });
    const hashed = await authService.hashPassword(password);
    const user = await User.create({ email, name, password: hashed, role, status: 'pending' });
    await sendApprovalRequestEmail({ name, email, role, userId: user._id });
    logger.info('New user registered, pending approval', { email, role });
    res.status(201).json({
      success: true,
      message: 'Registration submitted. Waiting for admin approval.',
      data: { userId: user._id, email: user.email, role: user.role, status: 'pending' },
    });
  } catch (err) {
    logger.error('Signup failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// POST /login (supplier/customer only)
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) { authAttempts.inc({ type: 'login', success: 'false' }); return res.status(401).json({ success: false, message: 'Invalid email or password' }); }
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Admin accounts must use /api/v1/auth/admin/login' });
    if (user.status !== 'approved') {
      const msg = user.status === 'pending' ? 'Your account is pending admin approval' : 'Your account has been denied. Contact admin.';
      return res.status(403).json({ success: false, message: msg });
    }
    const valid = await authService.comparePassword(password, user.password);
    if (!valid) { authAttempts.inc({ type: 'login', success: 'false' }); return res.status(401).json({ success: false, message: 'Invalid email or password' }); }
    const accessToken  = authService.generateAccessToken(user._id.toString(), user.email, user.role);
    const refreshToken = authService.generateRefreshToken(user._id.toString());
    if (user.role === 'supplier') await sendLoginSuccessEmail({ name: user.name, email: user.email });
    authAttempts.inc({ type: 'login', success: 'true' });
    logger.info('User logged in', { email: user.email, role: user.role });
    res.status(200).json({
      success: true, message: 'Login successful',
      data: { user_id: user._id, email: user.email, name: user.name, role: user.role },
      tokens: { access_token: accessToken, refresh_token: refreshToken },
    });
  } catch (err) {
    logger.error('Login failed', { error: err.message });
    authAttempts.inc({ type: 'login', success: 'false' });
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// POST /admin/login
router.post('/admin/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) { authAttempts.inc({ type: 'admin_login', success: 'false' }); return res.status(401).json({ success: false, message: 'Invalid admin credentials' }); }
    const valid = await authService.comparePassword(password, user.password);
    if (!valid) { authAttempts.inc({ type: 'admin_login', success: 'false' }); return res.status(401).json({ success: false, message: 'Invalid admin credentials' }); }
    const accessToken  = authService.generateAccessToken(user._id.toString(), user.email, 'admin');
    const refreshToken = authService.generateRefreshToken(user._id.toString());
    authAttempts.inc({ type: 'admin_login', success: 'true' });
    logger.info('Admin logged in', { email: user.email });
    res.status(200).json({
      success: true, message: 'Admin login successful',
      data: { user_id: user._id, email: user.email, name: user.name, role: 'admin' },
      tokens: { access_token: accessToken, refresh_token: refreshToken },
    });
  } catch (err) {
    logger.error('Admin login failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// GET /admin/registrations
router.get('/admin/registrations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const users = await User.find({ role: { $ne: 'admin' }, status }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    logger.error('Failed to fetch registrations', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
});

// POST /admin/registrations/:id/approve
router.post('/admin/registrations/:id/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'approved', updatedAt: new Date() }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    logger.info('Admin approved user', { userId: user._id, email: user.email });
await sendApprovalEmail({ name: user.name, email: user.email });
res.json({ success: true, message: user.email + ' approved', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Approval failed' });
  }
});

// POST /admin/registrations/:id/deny
router.post('/admin/registrations/:id/deny', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'denied', updatedAt: new Date() }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: user.email + ' denied', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Denial failed' });
  }
});

// DELETE /admin/users/:id
router.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'denied', updatedAt: new Date() }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    logger.info('Admin kicked user', { userId: user._id, email: user.email, by: req.user.email });
    res.json({ success: true, message: user.email + ' has been deactivated', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to deactivate user' });
  }
});

// POST /refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ success: false, message: 'Refresh token required' });
    const decoded = authService.verifyToken(refresh_token);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    const newAccessToken = authService.generateAccessToken(user._id.toString(), user.email, user.role);
    res.json({ success: true, tokens: { access_token: newAccessToken } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

// GET /me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// POST /logout
router.post('/logout', authMiddleware, async (req, res) => {
  logger.info('User logged out', { userId: req.user.userId });
  res.json({ success: true, message: 'Logout successful' });
});

export default router;