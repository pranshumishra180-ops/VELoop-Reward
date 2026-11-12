
import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referralCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "rewarded", "rejected"],
      default: "pending",
    },

    rewardXP: {
      type: Number,
      default: 0,
      min: 0,
    },

    rewardedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate referral records
referralSchema.index(
  { referredUserId: 1 },
  { unique: true }
);

const Referral = mongoose.model("Referral", referralSchema);

export default Referral;
