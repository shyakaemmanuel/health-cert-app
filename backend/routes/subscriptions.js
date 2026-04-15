const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const PLANS = {
  free: { max_certificates: 5 },
  basic: { max_certificates: 25 },
  premium: { max_certificates: 100 },
};

router.get('/', authenticate, (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(req.user.id);
  if (!sub) return res.status(404).json({ error: 'No subscription found' });
  res.json(sub);
});

router.put('/upgrade', authenticate, [
  body('plan').isIn(['basic', 'premium']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { plan } = req.body;
  const config = PLANS[plan];
  const now = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const existing = db.prepare('SELECT id FROM subscriptions WHERE user_id = ?').get(req.user.id);
  if (existing) {
    db.prepare('UPDATE subscriptions SET plan = ?, max_certificates = ?, start_date = ?, end_date = ?, is_active = 1 WHERE user_id = ?').run(plan, config.max_certificates, now, endDate, req.user.id);
  } else {
    const id = uuidv4();
    db.prepare('INSERT INTO subscriptions (id, user_id, plan, max_certificates, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)').run(id, req.user.id, plan, config.max_certificates, now, endDate);
  }
  
  const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(req.user.id);
  res.json(sub);
});

module.exports = router;
