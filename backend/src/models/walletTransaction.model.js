
import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    transactionType: {
      type: String,
      enum: ["credit", "debit"],
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
      min: 0.01,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
      default: "completed",
    },

    referenceId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);

export default WalletTransaction;
