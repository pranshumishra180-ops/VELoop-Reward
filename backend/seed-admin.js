import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import User from "./src/models/user.model.js";
import Wallet from "./src/models/wallet.model.js";

// Create Admin Account
const createAdmin = async () => {
  try {
    // Check environment variables
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } =
      process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGODB_URI) {
      throw new Error("Please configure all admin variables in .env");
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("Admin password must be at least 12 characters long");
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");

    const email = ADMIN_EMAIL.toLowerCase().trim();

    // Check whether admin already exists
    let admin = await User.findOne({ email });

    if (admin && admin.role !== "admin") {
      throw new Error(
        "This email belongs to a normal user. Please use a separate admin email."
      );
    }

    if (!admin) {
      // Hash password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

      // Create admin user
      admin = await User.create({
        name: ADMIN_NAME.trim(),
        email,
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });

      console.log("Admin account created successfully!");
    } else {
      console.log("Admin account already exists.");
    }

    // Ensure admin has a wallet
    const existingWallet = await Wallet.findOne({
      userId: admin._id,
    });

    if (!existingWallet) {
      await Wallet.create({
        userId: admin._id,
      });

      console.log("Admin wallet created successfully!");
    }

    console.log("Admin setup completed successfully!");
  } catch (error) {
    console.error("Admin Setup Error:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  }
};

createAdmin();