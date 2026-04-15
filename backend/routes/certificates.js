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
    
    // Check subscription limits
    const sub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND is_active = 1').get(req.user.id);
    if (!sub) return res.status(403).json({ error: 'No active subscription' });
    
    const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates WHERE user_id = ?').get(req.user.id).count;
    if (certCount >= sub.max_certificates) return res.status(403).json({ error: 'Certificate limit reached. Upgrade your subscription.' });

    const id = uuidv4();
    const qr_code_data = `HEALTH-CERT:${id}`;
    
    db.prepare('INSERT INTO certificates (id, user_id, certificate_type, issued_date, expiry_date, issuer, qr_code_data) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, req.user.id, certificate_type, issued_date, expiry_date, issuer, qr_code_data);

    const qrImage = await QRCode.toDataURL(qr_code_data, { errorCorrectionLevel: 'H', width: 300 });
    
    res.status(201).json({ id, certificate_type, issued_date, expiry_date, issuer, status: 'active', qr_code: qrImage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
});

// Get user's certificates
router.get('/', authenticate, (req, res) => {
  const certs = db.prepare('SELECT id, certificate_type, issued_date, expiry_date, issuer, status, created_at FROM certificates WHERE user_id = ?').all(req.user.id);
  res.json(certs);
});

// Get QR code for a certificate
router.get('/:id/qr', authenticate, async (req, res) => {
  const cert = db.prepare('SELECT * FROM certificates WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!cert) return res.status(404).json({ error: 'Certificate not found' });
  const qrImage = await QRCode.toDataURL(cert.qr_code_data, { errorCorrectionLevel: 'H', width: 300 });
  res.json({ qr_code: qrImage, certificate: { id: cert.id, certificate_type: cert.certificate_type, status: cert.status } });
});

// Verify certificate (public endpoint)
router.post('/verify', [
  body('qr_data').trim().notEmpty().isLength({ max: 500 }),
], validate, (req, res) => {
  try {
    const { qr_data } = req.body;
    const cert = db.prepare(`
      SELECT c.*, u.full_name, u.email 
      FROM certificates c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.qr_code_data = ?
    `).get(qr_data);

    const logId = uuidv4();
    const ip = req.ip || 'unknown';

    if (!cert) {
      db.prepare('INSERT INTO verification_logs (id, result, ip_address) VALUES (?, ?, ?)').run(logId, 'invalid', ip);
      return res.json({ valid: false, result: 'invalid', message: 'Certificate not found' });
    }

    // Check expiry
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

    db.prepare('INSERT INTO verification_logs (id, certificate_id, result, ip_address) VALUES (?, ?, ?, ?)').run(logId, cert.id, result, ip);

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
