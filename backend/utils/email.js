const nodemailer = require("nodemailer");

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
} = process.env;

let transporter;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn(
    "⚠️ SMTP settings are incomplete. Signup emails will not be sent until SMTP_HOST, SMTP_USER, and SMTP_PASS are configured."
  );
}

const sendMail = async ({ to, subject, html }) => {
  if (!transporter) {
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject,
    html,
  });
};

const sendWelcomeEmail = async ({ name, email }) => {
  const safeName = name || "Traveler";

  const html = `
<div style="background-color:#f3f4f6; padding:32px 16px; font-family: Arial, sans-serif; color:#111827;">
  <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:24px 24px 28px; box-shadow:0 10px 25px rgba(15,23,42,0.12);">
    <div style="text-align:center; margin-bottom:20px;">
      <div style="display:inline-block; padding:10px 16px; border-radius:999px; background:linear-gradient(135deg,#2563eb,#22c55e); color:#ffffff; font-weight:bold; font-size:18px;">
        Travel Buddy ✈️
      </div>
    </div>
    <h2 style="color:#111827; font-size:24px; margin:16px 0 8px; text-align:center;">
      Hey ${safeName}, welcome to the crew! 👋
    </h2>
    <p style="color:#4b5563; font-size:14px; text-align:center; margin:0 0 20px;">
      You’ve just joined a community of hikers and travelers who love exploring together.
    </p>
    <div style="background-color:#eff6ff; border-radius:10px; padding:16px 18px; margin-bottom:20px; border:1px solid #dbeafe;">
      <p style="color:#1d4ed8; font-size:14px; margin:0;">
        🌍 <strong>Travel Buddy</strong> helps you discover trails, find travel buddies, and keep your adventures organized in one place.
      </p>
    </div>
    <h3 style="font-size:16px; margin:0 0 10px; color:#111827;">
      Here’s what you can do next:
    </h3>
    <ul style="padding-left:18px; margin:0 0 18px; color:#374151; font-size:14px;">
      <li>🔎 Discover curated hikes around Nepal based on your interests</li>
      <li>🤝 Connect with travelers who match your vibe and pace</li>
      <li>📸 Share your trail reviews, photos, and favorite spots</li>
    </ul>
    <div style="text-align:center; margin:22px 0 18px;">
      <a href="https://your-travel-buddy-url.com"
         style="display:inline-block; padding:12px 22px; border-radius:999px; background:linear-gradient(135deg,#2563eb,#22c55e); color:#ffffff; font-weight:600; font-size:14px; text-decoration:none;">
        Open Travel Buddy 🚀
      </a>
    </div>
    <p style="margin:10px 0 0; font-size:14px; color:#4b5563;">
      We’re excited to see where you go next. 🌄  
      <br/>If you ever get stuck or have ideas to improve Travel Buddy, just hit reply — we’re listening.
    </p>
    <p style="margin-top:18px; font-size:13px; color:#9ca3af;">
      — The Travel Buddy Team
    </p>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0 10px;" />
    <p style="font-size:11px; color:#9ca3af; margin:0;">
      You’re receiving this email because you signed up for Travel Buddy.
    </p>
  </div>
</div>
`;

  try {
    await sendMail({
      to: email,
      subject: "Welcome to Travel Buddy 👋",
      html,
    });
  } catch (err) {
    console.error("Failed to send welcome email:", err.message);
  }
};

const sendPasswordResetEmail = async ({ name, email, resetUrl }) => {
  const safeName = name || "Traveler";
  const html = `
<div style="background-color:#f3f4f6; padding:32px 16px; font-family: Arial, sans-serif; color:#111827;">
  <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:12px; padding:24px 24px 28px; box-shadow:0 10px 25px rgba(15,23,42,0.12);">
    <div style="text-align:center; margin-bottom:20px;">
      <div style="display:inline-block; padding:10px 16px; border-radius:999px; background:linear-gradient(135deg,#2563eb,#22c55e); color:#ffffff; font-weight:bold; font-size:18px;">
        Travel Buddy ✈️
      </div>
    </div>
    <h2 style="color:#111827; font-size:22px; margin:16px 0 8px; text-align:center;">
      Reset your password, ${safeName}
    </h2>
    <p style="color:#4b5563; font-size:14px; text-align:center; margin:0 0 20px;">
      We received a request to reset your Travel Buddy password. Click the button below to choose a new one.
    </p>
    <div style="text-align:center; margin:22px 0 18px;">
      <a href="${resetUrl}"
         style="display:inline-block; padding:12px 28px; border-radius:999px; background:linear-gradient(135deg,#2563eb,#22c55e); color:#ffffff; font-weight:600; font-size:15px; text-decoration:none;">
        Reset Password
      </a>
    </div>
    <p style="color:#6b7280; font-size:13px; text-align:center; margin:0 0 12px;">
      This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.
    </p>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0 10px;" />
    <p style="font-size:11px; color:#9ca3af; margin:0; text-align:center;">
      — The Travel Buddy Team
    </p>
  </div>
</div>
`;
  try {
    await sendMail({
      to: email,
      subject: "Reset your Travel Buddy password 🔑",
      html,
    });
  } catch (err) {
    console.error("Failed to send password reset email:", err.message);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
};

