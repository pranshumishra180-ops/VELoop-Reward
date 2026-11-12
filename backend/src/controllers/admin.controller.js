
import mongoose from "mongoose";

import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import User from "../models/user.model.js";
import AdminAuditLog from "../models/adminAuditLog.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { createActivityLog } from "./activityLog.controller.js";
import LevelConfiguration from "../models/levelConfiguration.model.js";


// ==========================================
// 1. ADMIN: CREDIT OR DEBIT USER WALLET
// ==========================================

export const adjustUserWallet = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {userId,transactionType,assetType,amount,description,} = req.body;

    // Validate required fields
    if (!userId || !transactionType || !assetType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate MongoDB user ID
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Validate transaction type
    if (!["credit", "debit"].includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    // Validate asset type
    const allowedAssets = ["VEs", "SVEs", "gems", "tokens", "XP"];

    if (!allowedAssets.includes(assetType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset type",
      });
    }

    // Validate amount
    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    // Verify target user
    const targetUser = await User.findById(userId).session(session);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    let updatedBalance;
    let transaction;

    // Start atomic database transaction
    await session.withTransaction(async () => {
      // Find user's wallet
      const wallet = await Wallet.findOne({
        userId: targetUser._id,
      }).session(session);

      if (!wallet) {
        throw new Error("WALLET_NOT_FOUND");
      }

      // Get current balance
      const currentBalance = wallet[assetType];

      // Check sufficient balance for debit
      if (
        transactionType === "debit" &&
        currentBalance < amount
      ) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // Calculate updated balance
      updatedBalance =
        transactionType === "credit"
          ? currentBalance + amount
          : currentBalance - amount;

      // Update wallet
      wallet[assetType] = updatedBalance;
      await wallet.save({ session });

      // Create wallet transaction
      [transaction] = await WalletTransaction.create(
        [
          {
            userId: wallet.userId,
            walletId: wallet._id,
            transactionType,
            assetType,
            amount,
            description:
              description || "Admin wallet adjustment",
            status: "completed",
          },
        ],
        { session }
      );

      // Create admin audit log
      await AdminAuditLog.create(
        [
          {
            adminId: req.user._id,
            targetUserId: wallet.userId,
            action:
              transactionType === "credit"
                ? "wallet_credit"
                : "wallet_debit",
            assetType,
            amount,
            description:
              description || "Admin wallet adjustment",
          },
        ],
        { session }
      );
    });
          // Save wallet activity for the target user
    try {
      await createActivityLog(
        targetUser._id,
        transactionType === "credit"
          ? "wallet_credit"
          : "wallet_debit",
        `Admin ${transactionType}ed ${amount} ${assetType}`,
        {
          assetType,
          amount,
          transactionType,
          transactionId: transaction._id,
        }
      );
    } catch (logError) {
      console.error("Wallet Activity Log Error:", logError);
    }
    return res.status(200).json({
      success: true,
      message: "Wallet updated successfully",
      balance: updatedBalance,
      transaction,
    });
  } catch (error) {
    console.error("Admin Wallet Adjustment Error:", error);

    if (error.message === "WALLET_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User wallet not found",
      });
    }

    if (error.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    await session.endSession();
  }
};


// ==========================================
// 2. ADMIN: GET AUDIT LOGS
// ==========================================

export const getAdminAuditLogs = async (req, res) => {
  try {
    // Validate action filter
    const allowedActions = ["wallet_credit", "wallet_debit"];

    if (
      req.query.action &&
      !allowedActions.includes(req.query.action)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid action filter",
      });
    }

    // Validate asset filter
    const allowedAssets = ["VEs", "SVEs", "gems", "tokens", "XP"];

    if (
      req.query.assetType &&
      !allowedAssets.includes(req.query.assetType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset type filter",
      });
    }

    // Validate target user ID
    if (
      req.query.targetUserId &&
      !mongoose.isValidObjectId(req.query.targetUserId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid target user ID",
      });
    }

    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build filters
    const filter = {
      ...(req.query.action && { action: req.query.action }),
      ...(req.query.assetType && { assetType: req.query.assetType }),
      ...(req.query.targetUserId && {
        targetUserId: req.query.targetUserId,
      }),
    };

    // Fetch audit logs and filtered count
    const [logs, totalLogs] = await Promise.all([
      AdminAuditLog.find(filter)
        .populate("adminId", "name email")
        .populate("targetUserId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      AdminAuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Admin audit logs fetched successfully",
      pagination: {
        totalLogs,
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
        limit,
      },
      logs,
    });
  } catch (error) {
    console.error("Admin Audit Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// ==========================================
// 3. ADMIN: GET ALL USERS
// ==========================================

export const getAllUsers = async (req, res) => {
  try {
    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Search by name or email
    const search = req.query.search?.trim();

    // Only fetch normal users
    const filter = {
      role: "user",
    };

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Fetch users and total count
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      pagination: {
        totalUsers,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        limit,
      },
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// 4. ADMIN: UPDATE USER STATUS


export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    // Validate user ID
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Validate status
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    // Find normal user
    const user = await User.findOne({
      _id: userId,
      role: "user",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user status
    user.isActive = isActive;
    await user.save();

    // Create activity log
    try {
      await createActivityLog(
        user._id,
        isActive ? "account_activated" : "account_deactivated",
        isActive
          ? "Admin activated user account"
          : "Admin deactivated user account",
        {
          changedBy: req.user._id,
          isActive,
        }
      );
    } catch (logError) {
      console.error("User Status Activity Log Error:", logError);
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update User Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



 // ==========================================
// 5. ADMIN: GET USER DETAILS
// ==========================================

export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate MongoDB user ID
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Find user without password
    const user = await User.findOne({
      _id: userId,
      role: "user",
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch wallet and recent transactions
    const [wallet, transactions] = await Promise.all([
      Wallet.findOne({ userId: user._id }),

      WalletTransaction.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user,
      wallet,
      recentTransactions: transactions,
    });
  } catch (error) {
    console.error("Get User Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




// ==========================================
// 6. ADMIN: GET DASHBOARD STATISTICS
// ==========================================

export const getAdminDashboardStats = async (req, res) => {
  try {
    // Fetch all dashboard statistics together
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalTransactions,
      walletStats,
    ] = await Promise.all([
      // Total registered normal users
      User.countDocuments({ role: "user" }),

      // Active users
      User.countDocuments({
        role: "user",
        isActive: true,
      }),

      // Inactive users
      User.countDocuments({
        role: "user",
        isActive: false,
      }),

      // Total wallet transactions
      WalletTransaction.countDocuments(),

      // Total assets across all wallets
      Wallet.aggregate([
        {
          $group: {
            _id: null,
            totalVEs: { $sum: "$VEs" },
            totalSVEs: { $sum: "$SVEs" },
            totalGems: { $sum: "$gems" },
            totalTokens: { $sum: "$tokens" },
            totalXP: { $sum: "$XP" },
          },
        },
      ]),
    ]);

    // Get wallet totals or default to zero
    const totals = walletStats[0] || {
      totalVEs: 0,
      totalSVEs: 0,
      totalGems: 0,
      totalTokens: 0,
      totalXP: 0,
    };

    return res.status(200).json({
      success: true,
      message: "Admin dashboard statistics fetched successfully",

      statistics: {
        users: {
          totalUsers,
          activeUsers,
          inactiveUsers,
        },

        totalTransactions,

        wallet: {
          totalVEs: totals.totalVEs,
          totalSVEs: totals.totalSVEs,
          totalGems: totals.totalGems,
          totalTokens: totals.totalTokens,
          totalXP: totals.totalXP,
        },
      },
    });
  } catch (error) {
    console.error("Admin Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



 // ==========================================
// 7. ADMIN: GET ALL USER ACTIVITY LOGS
// ==========================================

export const getAllActivityLogs = async (req, res) => {
  try {
    // Pagination
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build filters
    const filter = {};

    if (req.query.userId) {
      if (!mongoose.isValidObjectId(req.query.userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      filter.userId = req.query.userId;
    }

    if (req.query.activityType) {
      filter.activityType = req.query.activityType;
    }

    // Fetch activity logs and total count
    const [activities, totalActivities] = await Promise.all([
      ActivityLog.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      ActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "All user activity logs fetched successfully",
      pagination: {
        totalActivities,
        currentPage: page,
        totalPages: Math.ceil(totalActivities / limit),
        limit,
      },
      activities,
    });
  } catch (error) {
    console.error("Get All Activity Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getAllLevels = async (req, res) => {
  try {
    const levels = await LevelConfiguration.find().sort({
      requiredXP: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Levels fetched successfully",
      totalLevels: levels.length,
      levels,
    });
  } catch (error) {
    console.error("Get All Levels Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




// ==========================================
// ADMIN: CREATE NEW LEVEL
// ==========================================

export const createLevel = async (req, res) => {
  try {
    const { level, name, requiredXP, description } = req.body;

    if (
      level === undefined ||
      !name ||
      requiredXP === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Level, name and requiredXP are required",
      });
    }

    if (
      !Number.isInteger(level) ||
      level < 1 ||
      typeof requiredXP !== "number" ||
      !Number.isFinite(requiredXP) ||
      requiredXP < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid level or requiredXP value",
      });
    }

    const existingLevel = await LevelConfiguration.findOne({
      $or: [{ level }, { name }],
    });

    if (existingLevel) {
      return res.status(409).json({
        success: false,
        message: "Level number or name already exists",
      });
    }

    const newLevel = await LevelConfiguration.create({
      level,
      name,
      requiredXP,
      description: description || "",
    });

    return res.status(201).json({
      success: true,
      message: "Level created successfully",
      level: newLevel,
    });
  } catch (error) {
    console.error("Create Level Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



export const updateLevel = async (req, res) => {
  try {
    const { levelId } = req.params;
    const { name, requiredXP, description, isActive } = req.body;

    if (!mongoose.isValidObjectId(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID",
      });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (requiredXP !== undefined) {
      if (
        typeof requiredXP !== "number" ||
        !Number.isFinite(requiredXP) ||
        requiredXP < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "requiredXP must be a non-negative number",
        });
      }

      updateData.requiredXP = requiredXP;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    const updatedLevel = await LevelConfiguration.findByIdAndUpdate(
      levelId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedLevel) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Level updated successfully",
      level: updatedLevel,
    });
  } catch (error) {
    console.error("Update Level Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};




export const deleteLevel = async (req, res) => {
  try {
    const { levelId } = req.params;

    if (!mongoose.isValidObjectId(levelId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID",
      });
    }

    const deletedLevel = await LevelConfiguration.findByIdAndDelete(
      levelId
    );

    if (!deletedLevel) {
      return res.status(404).json({
        success: false,
        message: "Level not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Level deleted successfully",
      level: deletedLevel,
    });
  } catch (error) {
    console.error("Delete Level Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

