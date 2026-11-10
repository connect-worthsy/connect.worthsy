const express = require('express');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const Razorpay = require('razorpay');

const app = express();
const PORT = process.env.PORT || 10000;
const ALLOWED_ORIGINS = new Set([
  'https://worthsy.in',
  'https://www.worthsy.in'
]);

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '20kb', strict: true }));

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many payment requests. Please try again later.' }
});

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    const error = new Error('Payment service is not configured.');
    error.status = 503;
    throw error;
  }
  return { keyId, keySecret, client: new Razorpay({ key_id: keyId, key_secret: keySecret }) };
}

app.get('/health', (_req, res) => res.status(200).json({ ok: true, service: 'worthsy-payment-api' }));

app.post('/create-order', paymentLimiter, async (req, res) => {
  let config;
  try {
    config = getRazorpay();
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }

  const amount = Number(req.body && req.body.amount);
  const currency = String((req.body && req.body.currency) || 'INR').toUpperCase();
  const receipt = String((req.body && req.body.receipt) || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 40);

  if (!Number.isSafeInteger(amount) || amount < 100) {
    return res.status(400).json({ error: 'Amount must be an integer of at least 100 paise.' });
  }
  if (currency !== 'INR') {
    return res.status(400).json({ error: 'Only INR payments are supported.' });
  }
  if (receipt.startsWith('TRIAL_') && amount !== 100) {
    return res.status(400).json({ error: 'The Razorpay trial product must be exactly ₹1.' });
  }

  try {
    const order = await config.client.orders.create({
      amount,
      currency,
      receipt: receipt || ('ws_' + Date.now())
    });
    return res.status(200).json({
      key_id: config.keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    const status = error && error.statusCode === 401 ? 401 : 502;
    console.error('Razorpay create order failed:', error && error.error && error.error.description || error.message || 'unknown error');
    return res.status(status).json({
      error: status === 401
        ? 'Razorpay authentication failed. Check server credentials.'
        : 'Could not create a payment order. Please try again.'
    });
  }
});

app.post('/verify-payment', paymentLimiter, (req, res) => {
  let config;
  try {
    config = getRazorpay();
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }

  const body = req.body || {};
  const orderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
  const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';

  if (!orderId || !paymentId || !signature || !/^[a-f0-9]{64}$/i.test(signature)) {
    return res.status(400).json({ verified: false, error: 'Missing or invalid payment verification fields.' });
  }

  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', config.keySecret)
    .update(orderId + '|' + paymentId)
    .digest();
  const supplied = Buffer.from(signature, 'hex');

  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(400).json({ verified: false, error: 'Payment signature verification failed.' });
  }

  return res.status(200).json({
    verified: true,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON request body.' });
  }
  console.error('Payment API error:', error.message || error);
  return res.status(500).json({ error: 'Unexpected payment service error.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('WORTHSY payment API listening on port ' + PORT);
});
