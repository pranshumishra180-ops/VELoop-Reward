
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("Database Connected Successfully🎉🎉");
    console.log("Database Name:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    throw error;
  }
};

export default connectDB;
