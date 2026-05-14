const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

// Create certificate
router.post('/', authenticate, [
  body('certificate_type').trim().notEmpty().isLength({ max: 100 }).escape(),
  body('issued_date').isISO8601(),
  body('expiry_date').isISO8601(),
  body('issuer').trim().notEmpty().isLength({ max: 200 }).escape(),
], validate, async (req, res) => {
  try {
    const { certificate_type, issued_date, expiry_date, issuer } = req.body;

    const subResult = await db.query('SELECT * FROM subscriptions WHERE user_id = $1 AND is_active = TRUE', [req.user.id]);
    const sub = subResult.rows[0];
    if (!sub) return res.status(403).json({ error: 'No active subscription' });

    const countResult = await db.query('SELECT COUNT(*) as count FROM certificates WHERE user_id = $1', [req.user.id]);
    const certCount = parseInt(countResult.rows[0]?.count || '0', 10);
    if (certCount >= sub.max_certificates) return res.status(403).json({ error: 'Certificate limit reached. Upgrade your subscription.' });

    const id = uuidv4();
    const qr_code_data = `HEALTH-CERT:${id}`;

    await db.query('INSERT INTO certificates (id, user_id, certificate_type, issued_date, expiry_date, issuer, qr_code_data) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, req.user.id, certificate_type, issued_date, expiry_date, issuer, qr_code_data]);

    const qrImage = await QRCode.toDataURL(qr_code_data, { errorCorrectionLevel: 'H', width: 300 });

    res.status(201).json({ id, certificate_type, issued_date, expiry_date, issuer, status: 'active', qr_code: qrImage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
});

// Get user's certificates
router.get('/', authenticate, async (req, res) => {
  try {
    const certsResult = await db.query('SELECT id, certificate_type, issued_date, expiry_date, issuer, status, created_at FROM certificates WHERE user_id = $1', [req.user.id]);
    res.json(certsResult.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load certificates' });
  }
});

// Get QR code for a certificate
router.get('/:id/qr', authenticate, async (req, res) => {
  try {
    const certResult = await db.query('SELECT * FROM certificates WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const cert = certResult.rows[0];
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });

    const qrImage = await QRCode.toDataURL(cert.qr_code_data, { errorCorrectionLevel: 'H', width: 300 });
    res.json({ qr_code: qrImage, certificate: { id: cert.id, certificate_type: cert.certificate_type, status: cert.status } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load QR code' });
  }
});

// Verify certificate (public endpoint)
router.post('/verify', [
  body('qr_data').trim().notEmpty().isLength({ max: 500 }),
], validate, async (req, res) => {
  try {
    const { qr_data } = req.body;
    const certResult = await db.query(`
      SELECT c.*, u.full_name, u.email 
      FROM certificates c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.qr_code_data = $1
    `, [qr_data]);
    const cert = certResult.rows[0];

    const logId = uuidv4();
    const ip = req.ip || 'unknown';

    if (!cert) {
      await db.query('INSERT INTO verification_logs (id, result, ip_address) VALUES ($1, $2, $3)', [logId, 'invalid', ip]);
      return res.json({ valid: false, result: 'invalid', message: 'Certificate not found' });
    }

    const now = new Date();
    const expiry = new Date(cert.expiry_date);

    let result;
    if (cert.status === 'revoked') {
      result = 'revoked';
    } else if (expiry < now) {
      result = 'expired';
    } else {
      result = 'valid';
    }

    await db.query('INSERT INTO verification_logs (id, certificate_id, result, ip_address) VALUES ($1, $2, $3, $4)', [logId, cert.id, result, ip]);

    res.json({
      valid: result === 'valid',
      result,
      certificate: {
        holder_name: cert.full_name,
        certificate_type: cert.certificate_type,
        issued_date: cert.issued_date,
        expiry_date: cert.expiry_date,
        issuer: cert.issuer,
        status: result,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
