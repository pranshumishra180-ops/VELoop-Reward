
import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";
import LevelConfiguration from "../models/levelConfiguration.model.js";
import { createActivityLog } from "./activityLog.controller.js";

// ==========================================
// 1. GET LOGGED-IN USER PROFILE
// ==========================================

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 2. UPDATE LOGGED-IN USER PROFILE
// ==========================================

export const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one profile field is required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    try {
      await createActivityLog(
        updatedUser._id,
        "profile_update",
        "User updated profile successfully",
        { updatedFields: Object.keys(updateData) }
      );
    } catch (logError) {
      console.error("Profile Activity Log Error:", logError);
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 3. GET USER REWARDS SUMMARY
// ==========================================

export const getMyRewardsSummary = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "User wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rewards summary fetched successfully",
      rewards: {
        VEs: wallet.VEs,
        SVEs: wallet.SVEs,
        gems: wallet.gems,
        tokens: wallet.tokens,
        XP: wallet.XP,
      },
    });
  } catch (error) {
    console.error("Rewards Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 4. GET USER LEVEL PROGRESS
// ==========================================

export const getMyLevelProgress = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "User wallet not found",
      });
    }

    const currentXP = wallet.XP;

    const levels = await LevelConfiguration.find({
      isActive: true,
    }).sort({ requiredXP: 1 });

    if (levels.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active level configurations found",
      });
    }

    const currentLevel = [...levels]
      .reverse()
      .find((level) => currentXP >= level.requiredXP);

    const nextLevel = levels.find(
      (level) => currentXP < level.requiredXP
    );

    let progressPercentage = 0;
    let remainingXP = 0;

    if (nextLevel) {
      const currentLevelXP = currentLevel
        ? currentLevel.requiredXP
        : 0;

      const requiredXP = nextLevel.requiredXP - currentLevelXP;
      const earnedXP = currentXP - currentLevelXP;

      progressPercentage =
        requiredXP > 0
          ? Math.min(100, Math.round((earnedXP / requiredXP) * 100))
          : 100;

      remainingXP = Math.max(0, nextLevel.requiredXP - currentXP);
    }

    return res.status(200).json({
      success: true,
      message: "Level progress fetched successfully",
      levelProgress: {
        currentXP,
        currentLevel: currentLevel
          ? {
              level: currentLevel.level,
              name: currentLevel.name,
              requiredXP: currentLevel.requiredXP,
              description: currentLevel.description,
            }
          : null,
        nextLevel: nextLevel
          ? {
              level: nextLevel.level,
              name: nextLevel.name,
              requiredXP: nextLevel.requiredXP,
              description: nextLevel.description,
            }
          : null,
        remainingXP,
        progressPercentage,
        isMaxLevel: !nextLevel,
      },
    });
  } catch (error) {
    console.error("Level Progress Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 5. GET ACCOUNT SECURITY INFORMATION
// ==========================================

export const getAccountSecurity = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "name email role isActive createdAt updatedAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account security information fetched successfully",
      security: {
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.isActive ? "Active" : "Inactive",
        accountCreatedAt: user.createdAt,
        lastProfileUpdate: user.updatedAt,
        passwordChangeAvailable: true,
      },
    });
  } catch (error) {
    console.error("Account Security Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
