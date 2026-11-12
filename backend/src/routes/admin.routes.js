
import express from "express";

import {
  adjustUserWallet,
  getAdminAuditLogs,
  getAllUsers,
  updateUserStatus,
  getUserDetails,
  getAdminDashboardStats,
  getAllActivityLogs,
  getAllLevels,
  createLevel,
  updateLevel,
  deleteLevel,
} from "../controllers/admin.controller.js";


import {
  getAdminAchievements,
  createAchievement,
  updateAchievement,
  updateAchievementStatus,
  awardAchievementToUser,
} from "../controllers/achievement.controller.js";

import {
  protect,
  adminOnly,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// ==========================================
// WALLET MANAGEMENT
// ==========================================

router.post("/wallet/adjust", protect, adminOnly, adjustUserWallet);

// ==========================================
// AUDIT LOGS
// ==========================================

router.get("/audit-logs", protect, adminOnly, getAdminAuditLogs);

// ==========================================
// USER MANAGEMENT
// ==========================================

router.get("/users", protect, adminOnly, getAllUsers);

router.patch(
  "/users/:userId/status",
  protect,
  adminOnly,
  updateUserStatus
);

router.get("/users/:userId", protect, adminOnly, getUserDetails);

// ==========================================
// DASHBOARD & ACTIVITY LOGS
// ==========================================

router.get(
  "/dashboard/stats",
  protect,
  adminOnly,
  getAdminDashboardStats
);

router.get(
  "/activity-logs",
  protect,
  adminOnly,
  getAllActivityLogs
);

// ==========================================
// LEVEL MANAGEMENT
// ==========================================

router.get("/levels", protect, adminOnly, getAllLevels);

router.post("/levels", protect, adminOnly, createLevel);

router.patch(
  "/levels/:levelId",
  protect,
  adminOnly,
  updateLevel
);

router.delete(
  "/levels/:levelId",
  protect,
  adminOnly,
  deleteLevel
);

// ==========================================
// ACHIEVEMENT MANAGEMENT
// ==========================================

// Get All Achievements (Admin)
router.get(
  "/achievements",
  protect,
  adminOnly,
  getAdminAchievements
);

// Create Achievement
router.post(
  "/achievements",
  protect,
  adminOnly,
  createAchievement
);

// Update Achievement
router.patch(
  "/achievements/:achievementId",
  protect,
  adminOnly,
  updateAchievement
);

// Activate / Deactivate Achievement
router.patch(
  "/achievements/:achievementId/status",
  protect,
  adminOnly,
  updateAchievementStatus
);


// Award Achievement to User
router.post(
  "/achievements/award",
  protect,
  adminOnly,
  awardAchievementToUser
);

export default router;
