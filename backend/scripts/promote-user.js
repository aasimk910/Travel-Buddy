const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node scripts/promote-user.js <user-email>");
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || "travelbuddy";

  if (!mongoUri) {
    console.error("MONGO_URI is missing in backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { dbName });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.error(`User not found for email: ${email}`);
      process.exit(1);
    }

    const previousRole = user.role || "user";
    user.role = "admin";
    await user.save();

    console.log(`Success: ${user.email} role changed from '${previousRole}' to 'admin'.`);
  } catch (error) {
    console.error("Failed to promote user:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
