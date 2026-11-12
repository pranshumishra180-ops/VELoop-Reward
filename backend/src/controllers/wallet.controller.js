import Wallet from "../models/wallet.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";

// Get Logged-in User Wallet
export const getMyWallet = async (req, res) => {
  try {
    console.log("Logged-in User ID:", req.user._id.toString());

const allWallets = await Wallet.find({})
  .select("userId")
  .lean();

console.log(
  "Wallet Documents:",
  JSON.stringify(allWallets, null, 2)
);



console.log("UserId Type:", typeof allWallets[0]?.userId);

console.log(
  "UserId Constructor:",
  allWallets[0]?.userId?.constructor?.name
);

console.log("UserId $oid:", allWallets[0]?.userId?.$oid);

   const wallet = await Wallet.findOne({
  userId: req.user._id,
}).populate("userId");

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Wallet fetched successfully",
      wallet: {
        VEs: wallet.VEs,
        SVEs: wallet.SVEs,
        gems: wallet.gems,
        tokens: wallet.tokens,
        XP: wallet.XP,
      },
    });
  } catch (error) {
    console.error("Wallet Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Logged-in User Transaction History
export const getMyTransactions = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Transaction history fetched successfully",
      totalTransactions: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Transaction History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};