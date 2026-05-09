const express = require('express');
const router  = express.Router();
const { generateKeys, encrypt, decrypt, isPrime } = require('../../real_time/utils/rsa');

// ─── GET /api/health ──────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── POST /api/rsa/keygen ─────────────────────────────────────────────────────
// Body: { p, q }
// Returns: { p, q, n, phi, e, d }
router.post('/rsa/keygen', (req, res) => {
  const { p, q } = req.body;

  if (!p || !q) {
    return res.status(400).json({ error: 'p y q son requeridos' });
  }

  const pn = Number(p), qn = Number(q);

  if (!Number.isInteger(pn) || !Number.isInteger(qn) || pn < 2 || qn < 2) {
    return res.status(400).json({ error: 'p y q deben ser enteros mayores a 1' });
  }

  if (!isPrime(pn)) return res.status(400).json({ error: `p = ${pn} no es primo` });
  if (!isPrime(qn)) return res.status(400).json({ error: `q = ${qn} no es primo` });
  if (pn === qn)    return res.status(400).json({ error: 'p y q deben ser distintos' });

  try {
    const keys = generateKeys(pn, qn);
    res.json({ success: true, keys });
  } catch (err) {
    res.status(500).json({ error: 'Error generando claves', detail: err.message });
  }
});

// ─── POST /api/rsa/encrypt ────────────────────────────────────────────────────
// Body: { text, e, n }
// Returns: { ciphers, steps, formula }
router.post('/rsa/encrypt', (req, res) => {
  const { text, e, n } = req.body;

  if (!text || !e || !n) {
    return res.status(400).json({ error: 'text, e y n son requeridos' });
  }

  if (text.length > 500) {
    return res.status(400).json({ error: 'Mensaje demasiado largo (máx 500 caracteres)' });
  }

  try {
    const result = encrypt(text, Number(e), Number(n));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Error encriptando', detail: err.message });
  }
});

// ─── POST /api/rsa/decrypt ────────────────────────────────────────────────────
// Body: { ciphers, d, n }
// Returns: { text, steps, formula }
router.post('/rsa/decrypt', (req, res) => {
  const { ciphers, d, n } = req.body;

  if (!ciphers || !d || !n) {
    return res.status(400).json({ error: 'ciphers, d y n son requeridos' });
  }

  if (!Array.isArray(ciphers)) {
    return res.status(400).json({ error: 'ciphers debe ser un array' });
  }

  try {
    const result = decrypt(ciphers, Number(d), Number(n));
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Error desencriptando', detail: err.message });
  }
});

module.exports = router;