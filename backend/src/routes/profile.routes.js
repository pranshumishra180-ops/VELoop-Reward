
import express from "express";

import {
  getMyProfile,
  updateMyProfile,
  getMyRewardsSummary,
  getMyLevelProgress,
  getAccountSecurity,
} from "../controllers/profile.controller.js";

import {
  getAllAchievements,
  getMyAchievements,
} from "../controllers/achievement.controller.js";

import {
  getMyWithdrawals,
  getMyWithdrawalSummary,
} from "../controllers/withdrawal.controller.js";

import {
  getMyReferrals,
  getMyReferralSummary,
} from "../controllers/referral.controller.js";

import { getUserActivityLogs } from "../controllers/activityLog.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Profile APIs
router.get("/me", protect, getMyProfile);
router.patch("/me", protect, updateMyProfile);

// Account Security API
router.get("/security", protect, getAccountSecurity);

// Activity API
router.get("/activity", protect, getUserActivityLogs);

// Rewards API
router.get("/rewards", protect, getMyRewardsSummary);

// Level Progress API
router.get("/level-progress", protect, getMyLevelProgress);

// Achievement APIs
router.get("/available-achievements", protect, getAllAchievements);
router.get("/achievements", protect, getMyAchievements);

// Withdrawal APIs
router.get("/withdrawals", protect, getMyWithdrawals);
router.get("/withdrawal-summary", protect, getMyWithdrawalSummary);

// Referral APIs
router.get("/referrals", protect, getMyReferrals);
router.get("/referral-summary", protect, getMyReferralSummary);

export default router;
