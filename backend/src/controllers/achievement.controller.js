
import mongoose from "mongoose";
import Achievement from "../models/achievement.model.js";
import UserAchievement from "../models/userAchievement.model.js";
import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import AdminAuditLog from "../models/adminAuditLog.model.js";
import { createActivityLog } from "./activityLog.controller.js";

// ==========================================
// 1. GET ALL ACTIVE ACHIEVEMENTS (USER)
// ==========================================

export const getAllAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Achievements fetched successfully",
      totalAchievements: achievements.length,
      achievements,
    });
  } catch (error) {
    console.error("Get Achievements Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 2. GET LOGGED-IN USER ACHIEVEMENTS
// ==========================================

export const getMyAchievements = async (req, res) => {
  try {
    const userAchievements = await UserAchievement.find({
      userId: req.user._id,
    })
      .populate("achievementId")
      .sort({ earnedAt: -1 });

    return res.status(200).json({
      success: true,
      message: "User achievements fetched successfully",
      totalAchievements: userAchievements.length,
      achievements: userAchievements,
    });
  } catch (error) {
    console.error("User Achievements Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 3. GET ALL ACHIEVEMENTS (ADMIN)
// ==========================================

export const getAdminAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Admin achievements fetched successfully",
      totalAchievements: achievements.length,
      achievements,
    });
  } catch (error) {
    console.error("Admin Get Achievements Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 4. CREATE ACHIEVEMENT (ADMIN)
// ==========================================

export const createAchievement = async (req, res) => {
  try {
    const {
      title,
      description,
      icon,
      category,
      rewardXP,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const parsedRewardXP = Number(rewardXP ?? 0);

    if (
      !Number.isFinite(parsedRewardXP) ||
      parsedRewardXP < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Reward XP must be a valid non-negative number",
      });
    }

    const achievement = await Achievement.create({
      title: title.trim(),
      description: description.trim(),
      icon: icon || "",
      category: category || "general",
      rewardXP: parsedRewardXP,
    });

    return res.status(201).json({
      success: true,
      message: "Achievement created successfully",
      achievement,
    });
  } catch (error) {
    console.error("Create Achievement Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 5. UPDATE ACHIEVEMENT (ADMIN)
// ==========================================

export const updateAchievement = async (req, res) => {
  try {
    const { achievementId } = req.params;

    if (!achievementId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid achievement ID",
      });
    }

    const {
      title,
      description,
      icon,
      category,
      rewardXP,
    } = req.body;

    const updateData = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        !description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }
      updateData.description = description.trim();
    }

    if (icon !== undefined) updateData.icon = icon;
    if (category !== undefined) updateData.category = category;

    if (rewardXP !== undefined) {
      const parsedRewardXP = Number(rewardXP);

      if (
        !Number.isFinite(parsedRewardXP) ||
        parsedRewardXP < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Reward XP must be a valid non-negative number",
        });
      }

      updateData.rewardXP = parsedRewardXP;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
    }

    const achievement = await Achievement.findByIdAndUpdate(
      achievementId,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Achievement updated successfully",
      achievement,
    });
  } catch (error) {
    console.error("Update Achievement Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 6. ACTIVATE / DEACTIVATE ACHIEVEMENT
// ==========================================

export const updateAchievementStatus = async (req, res) => {
  try {
    const { achievementId } = req.params;
    const { isActive } = req.body;

    if (!achievementId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid achievement ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const achievement = await Achievement.findByIdAndUpdate(
      achievementId,
      { isActive },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: "Achievement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Achievement ${
        isActive ? "activated" : "deactivated"
      } successfully`,
      achievement,
    });
  } catch (error) {
    console.error("Update Achievement Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




// ==========================================
// 7. AWARD ACHIEVEMENT TO USER (ADMIN)
// ==========================================

export const awardAchievementToUser = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { userId, achievementId } = req.body;

    // Validate required fields
    if (!userId || !achievementId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Achievement ID are required",
      });
    }

    // Validate MongoDB IDs
    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(achievementId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid User ID or Achievement ID",
      });
    }

    // Start MongoDB transaction
    let responseData;

    await session.withTransaction(async () => {
      // Check target user
      const targetUser = await User.findById(userId).session(session);

      if (!targetUser || !targetUser.isActive) {
        const error = new Error("Active user not found");
        error.statusCode = 404;
        throw error;
      }

      // Check achievement
      const achievement = await Achievement.findOne({
        _id: achievementId,
        isActive: true,
      }).session(session);

      if (!achievement) {
        const error = new Error("Active achievement not found");
        error.statusCode = 404;
        throw error;
      }

      // Prevent duplicate achievement
      const existingAchievement = await UserAchievement.findOne({
        userId,
        achievementId,
      }).session(session);

      if (existingAchievement) {
        const error = new Error(
          "User has already received this achievement"
        );
        error.statusCode = 409;
        throw error;
      }

      // Find user's wallet
      const wallet = await Wallet.findOne({
        userId,
      }).session(session);

      if (!wallet) {
        const error = new Error("User wallet not found");
        error.statusCode = 404;
        throw error;
      }

      // Create user achievement record
      const [userAchievement] = await UserAchievement.create(
        [
          {
            userId,
            achievementId,
            earnedAt: new Date(),
            isClaimed: true,
          },
        ],
        { session }
      );

      const rewardXP = achievement.rewardXP;

      // Credit XP only if reward is greater than zero
      if (rewardXP > 0) {
        wallet.XP += rewardXP;
        await wallet.save({ session });

        // Create wallet transaction
        await WalletTransaction.create(
          [
            {
              userId,
              walletId: wallet._id,
              transactionType: "credit",
              assetType: "XP",
              amount: rewardXP,
              description: `XP reward for achievement: ${achievement.title}`,
              status: "completed",
              referenceId: userAchievement._id.toString(),
            },
          ],
          { session }
        );
      }

      // Create admin audit log
      await AdminAuditLog.create(
        [
          {
            adminId: req.user._id,
            targetUserId: userId,
            action: "achievement_awarded",
            assetType: "XP",
            amount: rewardXP,
            description: `Awarded achievement: ${achievement.title}`,
          },
        ],
        { session }
      );

      // Prepare response
      responseData = {
        achievement: userAchievement,
        title: achievement.title,
        rewardXP,
        updatedWalletXP: wallet.XP,
      };
    });

    // Record user activity after transaction commits
    try {
      await createActivityLog(
        userId,
        "achievement_awarded",
        `You received the achievement: ${responseData.title}`,
        {
          achievementId,
          rewardXP: responseData.rewardXP,
        }
      );
    } catch (logError) {
      console.error("Achievement Activity Log Error:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Achievement awarded successfully",
      data: responseData,
    });
  } catch (error) {
    console.error("Award Achievement Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  } finally {
    await session.endSession();
  }
};
