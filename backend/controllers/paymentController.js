// backend/controllers/paymentController.js
const axios = require("axios");

const KHALTI_SANDBOX_API = "https://dev.khalti.com/api/v2";
const KHALTI_SANDBOX_SECRET = process.env.KHALTI_SANDBOX_SECRET || "test_secret_key";

const getHealth = (req, res) => {
  res.json({ status: "ok", mode: "sandbox", khaltiApi: KHALTI_SANDBOX_API });
};

const initiateKhalti = async (req, res) => {
  try {
    const { amount, orderId, orderName, returnUrl, customer } = req.body;
    if (!amount || !orderId || !returnUrl) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const payload = {
      return_url: returnUrl,
      website_url: process.env.FRONTEND_URL || "http://localhost:5173",
      amount: Math.round(amount * 100),
      purchase_order_id: orderId,
      purchase_order_name: orderName || "Travel Buddy Order",
      customer_info: {
        name: customer?.name || "Customer",
        email: customer?.email || "customer@travelbuddy.app",
        phone: customer?.phone || "9800000000",
      },
    };

    const { data } = await axios.post(`${KHALTI_SANDBOX_API}/epayment/initiate/`, payload, {
      headers: {
        Authorization: `Key ${KHALTI_SANDBOX_SECRET}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    return res.json({
      pidx: data.pidx,
      payment_url: data.payment_url,
      expires_at: data.expires_at,
      amount: data.amount,
      status: data.status,
    });
  } catch (err) {
    console.error("Khalti error:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      error: err.response?.data?.detail || "Payment initiation failed",
    });
  }
};

const verifyKhalti = async (req, res) => {
  try {
    const pidx = req.query.pidx || req.body?.pidx;
    if (!pidx) {
      return res.status(400).json({ error: "Missing pidx parameter" });
    }

    const { data } = await axios.post(
      `${KHALTI_SANDBOX_API}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `Key ${KHALTI_SANDBOX_SECRET}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return res.json({
      pidx: data.pidx,
      status: data.status,
      transaction_id: data.transaction_id,
      amount: data.amount,
      fee: data.fee,
    });
  } catch (err) {
    console.error("Khalti verify error:", err.response?.data || err.message);
    return res.status(err.response?.status || 500).json({
      error: err.response?.data?.detail || "Verification failed",
    });
  }
};

module.exports = { getHealth, initiateKhalti, verifyKhalti };
