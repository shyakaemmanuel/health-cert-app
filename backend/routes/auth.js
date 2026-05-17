const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ===== VALIDATION MIDDLEWARE =====
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// ===== REGISTER ENDPOINT =====
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8-128 characters'),
  body('full_name')
    .trim()
    .notEmpty()
    .isLength({ max: 100 })
    .escape()
    .withMessage('Full name is required and must be less than 100 characters'),
], validate, async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    console.log('[AUTH] /register attempt', { email, fullName: full_name });

    // Check if user already exists
    const existingResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingResult.rows[0]) {
      console.warn('[AUTH] Registration failed: email already registered', { email });
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 12);
    
    console.log('[AUTH] Creating new user', { userId: id, email });

    // Create user
    await db.query(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)',
      [id, email, password_hash, full_name]
    );

    // Create free subscription
    const subId = uuidv4();
    const now = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    await db.query(
      'INSERT INTO subscriptions (id, user_id, plan, max_certificates, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6)',
      [subId, id, 'free', 5, now, endDate]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id, email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('[AUTH] Registration successful', { userId: id, email });

    res.status(201).json({
      token,
      user: { id, email, full_name, role: 'user' },
    });
  } catch (err) {
    console.error('[AUTH] Registration error:', {
      message: err.message,
      code: err.code,
      email: req.body.email,
    });

    // Handle specific database errors
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email already registered' });
    }

    res.status(500).json({ error: 'Registration failed' });
  }
});

// ===== LOGIN ENDPOINT =====
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (LOG_LEVEL === 'debug') {
      console.log('[AUTH] Login attempt', { email });
    }

    // Find user
    const userResult = await db.query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
      [email]
    );

    const user = userResult.rows[0];

    if (!user) {
      console.warn('[AUTH] Login failed: user not found', { email });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      console.warn('[AUTH] Login failed: invalid password', { email, userId: user.id });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('[AUTH] Login successful', { userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[AUTH] Login error:', {
      message: err.message,
      code: err.code,
      email: req.body.email,
    });

    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== VERIFY TOKEN ENDPOINT (for debugging) =====
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    console.warn('[AUTH] Token verification failed:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
