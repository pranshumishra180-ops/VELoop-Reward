import express from "express";
import { getMyWallet, getMyTransactions,} from "../controllers/wallet.controller.js";
import { protect } from "../middleware/auth.middleware.js";


const router = express.Router();

// Get Logged-in User Wallet
router.get("/me", protect, getMyWallet);


// Get logged-in user's complete transaction history
router.get("/transactions", protect, getMyTransactions);

export default router;