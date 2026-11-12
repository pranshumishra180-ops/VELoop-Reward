
import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    assetType: {
      type: String,
      enum: ["VEs", "SVEs", "gems", "tokens"],
      required: true,
    },

    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },

    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
const Withdrawal =
  mongoose.models.Withdrawal ||
  mongoose.model("Withdrawal", withdrawalSchema);

export default Withdrawal;
