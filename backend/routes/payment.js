// backend/routes/payment.js
// General-purpose Khalti payment routes for shop orders.
// Health check (public), payment initiation and verification (auth required).

// #region Imports
const express = require('express');
// #endregion Imports
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getHealth,
  initiateKhalti,
  verifyKhalti,
} = require('../controllers/paymentController');

// GET /api/payment/health — health check returning payment gateway status
router.get('/health', getHealth);
// POST /api/payment/khalti/initiate — start a Khalti payment session
router.post('/khalti/initiate', authenticateToken, initiateKhalti);
// POST /api/payment/khalti/verify — verify a completed payment by pidx
router.post('/khalti/verify', authenticateToken, verifyKhalti);

// #region Exports
module.exports = router;
// #endregion Exports
