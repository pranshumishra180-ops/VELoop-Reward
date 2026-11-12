
import Referral from "../models/referral.model.js";

// ==========================================
// 1. GET MY REFERRALS
// ==========================================

export const getMyReferrals = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {
      referrerId: req.user._id,
    };

    const [referrals, totalReferrals] = await Promise.all([
      Referral.find(filter)
        .populate("referredUserId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Referral.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Referrals fetched successfully",

      pagination: {
        totalReferrals,
        currentPage: page,
        totalPages: Math.ceil(totalReferrals / limit),
        limit,
      },

      referrals,
    });
  } catch (error) {
    console.error("Get Referrals Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ==========================================
// 2. GET REFERRAL SUMMARY
// ==========================================

export const getMyReferralSummary = async (req, res) => {
  try {
    const summary = await Referral.aggregate([
      {
        $match: {
          referrerId: req.user._id,
        },
      },
      {
        $group: {
          _id: "$status",
          totalReferrals: { $sum: 1 },
          totalRewardXP: { $sum: "$rewardXP" },
        },
      },
    ]);

    const referralSummary = {
      pending: { totalReferrals: 0, totalRewardXP: 0 },
      completed: { totalReferrals: 0, totalRewardXP: 0 },
      rewarded: { totalReferrals: 0, totalRewardXP: 0 },
      rejected: { totalReferrals: 0, totalRewardXP: 0 },
    };

    summary.forEach((item) => {
      referralSummary[item._id] = {
        totalReferrals: item.totalReferrals,
        totalRewardXP: item.totalRewardXP,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Referral summary fetched successfully",
      referralSummary,
    });
  } catch (error) {
    console.error("Referral Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
