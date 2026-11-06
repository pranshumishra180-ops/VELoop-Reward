import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    VEs: {
      type: Number,
      default: 0,
      min: 0,
    },

    SVEs: {
      type: Number,
      default: 0,
      min: 0,
    },

    gems: {
      type: Number,
      default: 0,
      min: 0,
    },

    tokens: {
      type: Number,
      default: 0,
      min: 0,
    },

    XP: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;