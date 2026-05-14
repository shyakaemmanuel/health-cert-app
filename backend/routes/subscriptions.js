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

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM subscriptions WHERE user_id = $1', [req.user.id]);
    const sub = result.rows[0];
    if (!sub) return res.status(404).json({ error: 'No subscription found' });
    res.json(sub);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load subscription' });
  }
});

router.put('/upgrade', authenticate, [
  body('plan').isIn(['basic', 'premium']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { plan } = req.body;
    const config = PLANS[plan];
    const now = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const existingResult = await db.query('SELECT id FROM subscriptions WHERE user_id = $1', [req.user.id]);
    if (existingResult.rows[0]) {
      await db.query('UPDATE subscriptions SET plan = $1, max_certificates = $2, start_date = $3, end_date = $4, is_active = TRUE WHERE user_id = $5', [plan, config.max_certificates, now, endDate, req.user.id]);
    } else {
      const id = uuidv4();
      await db.query('INSERT INTO subscriptions (id, user_id, plan, max_certificates, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6)', [id, req.user.id, plan, config.max_certificates, now, endDate]);
    }

    const subResult = await db.query('SELECT * FROM subscriptions WHERE user_id = $1', [req.user.id]);
    res.json(subResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upgrade subscription' });
  }
});

module.exports = router;
