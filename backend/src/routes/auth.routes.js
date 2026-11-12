
import express from "express";
import {
  registerUser,
  loginUser,
  changePassword
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Register API
router.post("/register", registerUser);

// Login API
router.post("/login", loginUser);

// Change Password API (Login required)
router.patch("/change-password", protect, changePassword);

export default router;
