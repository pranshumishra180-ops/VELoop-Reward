import Wallet from "../models/wallet.model.js";

// Get Logged-in User Wallet
export const getMyWallet = async (req, res) => {
  try {
    console.log("Logged-in User ID:", req.user._id.toString());
console.log("Database Name:", Wallet.db.name);
console.log("Collection Name:", Wallet.collection.name);
console.log("Total Wallets:", await Wallet.countDocuments());

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