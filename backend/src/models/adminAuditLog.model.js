
import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: [
        "wallet_credit",
        "wallet_debit",
        "achievement_awarded",
        "withdrawal_approved",
        "withdrawal_rejected",
        "withdrawal_completed",
      ],
      required: true,
    },

    assetType: {
      type: String,
      enum: ["VEs", "SVEs", "gems", "tokens", "XP"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const AdminAuditLog =
  mongoose.models.AdminAuditLog ||
  mongoose.model("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
