import express from "express";
import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/profile.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get Profile
router.get("/me", protect, getMyProfile);

// Update Profile
router.patch("/me", protect, updateMyProfile);

export default router;