import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import authService from '../services/authService.js';
import { authMiddleware } from '../middleware/index.js';
import logger from '../config/logger.js';
import { authAttempts } from '../metrics.js';

const router = express.Router();

// Create User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

const signupValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
];

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Signup
router.post(
  '/signup',
  signupValidator,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
        });
      }

      // Hash password
      const hashedPassword = await authService.hashPassword(password);

      // Create user
      const user = new User({
        email,
        password: hashedPassword,
        name,
      });

      await user.save();

      // Generate tokens
      const accessToken = authService.generateAccessToken(
        user._id.toString(),
        user.email,
        user.role
      );
      const refreshToken = authService.generateRefreshToken(user._id.toString());

      logger.info('User signed up successfully', { email: user.email });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user_id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    } catch (error) {
      logger.error('Signup failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Signup failed',
      });
    }
  }
);

// Login
router.post(
  '/login',
  loginValidator,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        authAttempts.inc({ type: 'login', success: 'false' });
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Compare password
      const isPasswordValid = await authService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        authAttempts.inc({ type: 'login', success: 'false' });
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate tokens
      const accessToken = authService.generateAccessToken(
        user._id.toString(),
        user.email,
        user.role
      );
      const refreshToken = authService.generateRefreshToken(user._id.toString());

      logger.info('User logged in', { email: user.email });
      authAttempts.inc({ type: 'login', success: 'true' });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user_id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    } catch (error) {
      logger.error('Login failed', { error: error.message });
      authAttempts.inc({ type: 'login', success: 'false' });
      res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  }
);

// Refresh token
router.post(
  '/refresh',
  async (req, res, next) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      const decoded = authService.verifyToken(refresh_token);

      // Fetch user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      const newAccessToken = authService.generateAccessToken(
        user._id.toString(),
        user.email,
        user.role
      );

      res.status(200).json({
        success: true,
        tokens: {
          access_token: newAccessToken,
        },
      });
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
  }
);

// Get current user
router.get(
  '/me',
  authMiddleware,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId).select('-password');

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error('Failed to fetch user', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
      });
    }
  }
);

// Logout (client-side operation, but endpoint for tracking)
router.post(
  '/logout',
  authMiddleware,
  async (req, res, next) => {
    try {
      logger.info('User logged out', { userId: req.user.userId });
      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }
);

export default router;
