// backend/routes/payment.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getHealth,
  initiateKhalti,
  verifyKhalti,
} = require('../controllers/paymentController');

router.get('/health', getHealth);
router.post('/khalti/initiate', authenticateToken, initiateKhalti);
router.post('/khalti/verify', authenticateToken, verifyKhalti);

module.exports = router;
