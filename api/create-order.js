const Razorpay = require('razorpay');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return res.status(500).json({ error: 'Payment service is not configured.' });

  const amount = Number(req.body && req.body.amount);
  const currency = String((req.body && req.body.currency) || 'INR').toUpperCase();
  const receipt = String((req.body && req.body.receipt) || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  if (!Number.isSafeInteger(amount) || amount < 100) {
    return res.status(400).json({ error: 'Amount must be an integer of at least 100 paise.' });
  }
  if (currency !== 'INR') return res.status(400).json({ error: 'Only INR payments are supported.' });

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({ amount, currency, receipt: receipt || ('ws_' + Date.now()) });
    return res.status(200).json({ key_id: keyId, order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    const status = err && err.statusCode === 401 ? 401 : 500;
    console.error('Razorpay create order failed:', err && err.error && err.error.description || err.message || 'unknown error');
    return res.status(status).json({ error: status === 401 ? 'Razorpay authentication failed. Check server credentials.' : 'Could not create a payment order. Please try again.' });
  }
};
