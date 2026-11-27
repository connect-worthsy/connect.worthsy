const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return res.status(500).json({ error: 'Payment service is not configured.' });

  const body = req.body || {};
  const orderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
  const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'Missing payment verification fields.' });
  }
  const expected = crypto.createHmac('sha256', secret).update(orderId + '|' + paymentId).digest();
  let supplied;
  try { supplied = Buffer.from(signature, 'hex'); } catch (_) {
    return res.status(400).json({ verified: false, error: 'Invalid payment signature.' });
  }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
    return res.status(400).json({ verified: false, error: 'Payment signature verification failed.' });
  }
  return res.status(200).json({ verified: true, razorpay_order_id: orderId, razorpay_payment_id: paymentId });
};
