// backend/scripts/promote-user.js
// CLI utility to promote a user to admin role by email address.
// Usage: node scripts/promote-user.js <user-email>

// #region Imports
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

// #endregion Imports
dotenv.config();

// Promotes the user whose email is passed as a CLI argument to the "admin" role.
async function main() {
  // Read email from command-line arguments
  const email = process.argv[2];

  // Validate that an email argument was provided
  if (!email) {
    console.error("Usage: node scripts/promote-user.js <user-email>");
    process.exit(1);
  }

  // Read MongoDB connection string from environment
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || "travelbuddy";

  if (!mongoUri) {
    console.error("MONGO_URI is missing in backend/.env");
    process.exit(1);
  }

  try {
    // Connect to the MongoDB database
    await mongoose.connect(mongoUri, { dbName });

    // Look up user by email (case-insensitive trim)
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.error(`User not found for email: ${email}`);
      process.exit(1);
    }

    // Save current role for logging, then promote to admin
    const previousRole = user.role || "user";
    user.role = "admin";
    await user.save();

    console.log(`Success: ${user.email} role changed from '${previousRole}' to 'admin'.`);
  } catch (error) {
    console.error("Failed to promote user:", error.message);
    process.exit(1);
  } finally {
    // Always disconnect from MongoDB when done
    await mongoose.disconnect();
  }
}

main();
