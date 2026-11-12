import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/user.model.js";

const resetAdminPassword = async () => {
  try {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, MONGODB_URI } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGODB_URI) {
      throw new Error("Missing environment variables");
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("Password must be at least 12 characters");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");

    const admin = await User.findOne({
      email: ADMIN_EMAIL.toLowerCase().trim(),
      role: "admin",
    });

    if (!admin) {
      throw new Error("Admin account not found");
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    admin.password = hashedPassword;
    await admin.save();

    console.log("Admin password updated successfully!");
  } catch (error) {
    console.error("Password Reset Error:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  }
};

resetAdminPassword();