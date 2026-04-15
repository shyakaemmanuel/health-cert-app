const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail().isLength({ max: 255 }),
  body('password').isLength({ min: 8, max: 128 }),
  body('full_name').trim().notEmpty().isLength({ max: 100 }).escape(),
], validate, async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 12);
    
    db.prepare('INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)').run(id, email, password_hash, full_name);
    
    // Create free subscription
    const subId = uuidv4();
    const now = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    db.prepare('INSERT INTO subscriptions (id, user_id, plan, max_certificates, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)').run(subId, id, 'free', 5, now, endDate);

    const token = jwt.sign({ id, email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id, email, full_name, role: 'user' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], validate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
