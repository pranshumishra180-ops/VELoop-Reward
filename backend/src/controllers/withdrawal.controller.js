import mongoose from "mongoose";
import Withdrawal from "../models/withdrawal.model.js";
import User from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import AdminAuditLog from "../models/adminAuditLog.model.js";
import { createActivityLog } from "./activityLog.controller.js";

// ==========================================
// 1. GET LOGGED-IN USER WITHDRAWAL HISTORY
// ==========================================

export const getMyWithdrawals = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {
      userId: req.user._id,
    };

    const [withdrawals, totalWithdrawals] = await Promise.all([
      Withdrawal.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Withdrawal.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Withdrawal history fetched successfully",

      pagination: {
        totalWithdrawals,
        currentPage: page,
        totalPages: Math.ceil(totalWithdrawals / limit),
        limit,
      },

      withdrawals,
    });
  } catch (error) {
    console.error("Withdrawal History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 2. GET WITHDRAWAL SUMMARY
// ==========================================

export const getMyWithdrawalSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const summary = await Withdrawal.aggregate([
      {
        $match: {
          userId: userId,
        },
      },
      {
        $group: {
          _id: "$status",
          totalRequests: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const withdrawalSummary = {
      pending: { totalRequests: 0, totalAmount: 0 },
      approved: { totalRequests: 0, totalAmount: 0 },
      rejected: { totalRequests: 0, totalAmount: 0 },
      completed: { totalRequests: 0, totalAmount: 0 },
    };

    summary.forEach((item) => {
      withdrawalSummary[item._id] = {
        totalRequests: item.totalRequests,
        totalAmount: item.totalAmount,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Withdrawal summary fetched successfully",
      withdrawalSummary,
    });
  } catch (error) {
    console.error("Withdrawal Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



// ==========================================
// 3. GET ALL WITHDRAWALS (ADMIN)
// ==========================================

export const getAllWithdrawals = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);

    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {};

    // Optional status filter
    if (req.query.status) {
      const allowedStatuses = [
        "pending",
        "approved",
        "rejected",
        "completed",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid withdrawal status",
        });
      }

      filter.status = req.query.status;
    }

    const [withdrawals, totalWithdrawals] = await Promise.all([
      Withdrawal.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Withdrawal.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "All withdrawals fetched successfully",

      pagination: {
        totalWithdrawals,
        currentPage: page,
        totalPages: Math.ceil(totalWithdrawals / limit),
        limit,
      },

      withdrawals,
    });
  } catch (error) {
    console.error("Admin Get Withdrawals Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
 