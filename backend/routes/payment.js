// backend/routes/payment.js
const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const KHALTI_API = 'https://a.khalti.com/api/v2';

// ── POST /api/payment/khalti/initiate ─────────────────────────────────────
// Initiates a Khalti ePay session.  Returns { pidx, payment_url, ... }
router.post('/khalti/initiate', async (req, res) => {
  try {
    const {
      amount,          // in NPR (we convert to paisa here)
      orderId,
      orderName,
      returnUrl,
      customer,        // { name, email, phone }
    } = req.body;

    if (!amount || !orderId || !returnUrl) {
      return res.status(400).json({ error: 'amount, orderId and returnUrl are required' });
    }

    const payload = {
      return_url:           returnUrl,
      website_url:          process.env.FRONTEND_URL || 'http://localhost:5173',
      amount:               Math.round(amount * 100),   // NPR → paisa
      purchase_order_id:    orderId,
      purchase_order_name:  orderName || 'Travel Buddy Order',
      customer_info: {
        name:  customer?.name  || 'Customer',
        email: customer?.email || 'customer@example.com',
        phone: customer?.phone || '9800000000',
      },
    };

    const { data } = await axios.post(
      `${KHALTI_API}/epayment/initiate/`,
      payload,
      {
        headers: {
          Authorization:  `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(data); // { pidx, payment_url, expires_at, expires_in }
  } catch (err) {
    console.error('Khalti initiation error:', err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data?.detail || 'Khalti payment initiation failed',
    });
  }
});

// ── GET /api/payment/khalti/verify?pidx=xxx ───────────────────────────────
// Looks up the payment status after user returns from Khalti.
router.get('/khalti/verify', async (req, res) => {
  try {
    const { pidx } = req.query;
    if (!pidx) return res.status(400).json({ error: 'pidx is required' });

    const { data } = await axios.post(
      `${KHALTI_API}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization:  `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(data); // { pidx, status, total_amount, transaction_id, ... }
  } catch (err) {
    console.error('Khalti verify error:', err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data?.detail || 'Khalti verification failed',
    });
  }
});

module.exports = router;
