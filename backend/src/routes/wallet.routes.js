import express from "express";
import { getMyWallet } from "../controllers/wallet.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get Logged-in User Wallet
router.get("/me", protect, getMyWallet);

export default router;