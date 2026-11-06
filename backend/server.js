
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./src/config/database.js";
import authRoutes from "./src/routes/auth.routes.js";
import profileRoutes from "./src/routes/profile.routes.js";
import walletRoutes from "./src/routes/wallet.routes.js";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Common middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//  Register user
app.use("/api/auth", authRoutes);

// get-me
app.use("/api/profile", profileRoutes);

// user wallet 
app.use("/api/wallet", walletRoutes);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", limiter);

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "VELoop Rewards API is running!",
  });
});

// Server start
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
