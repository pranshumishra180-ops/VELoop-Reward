
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import LevelConfiguration from "./src/models/levelConfiguration.model.js";

const seedLevels = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected Successfully");

    const levels = [
      {
        level: 1,
        name: "Beginner",
        requiredXP: 0,
        description: "Welcome to VELoop Rewards!",
      },
      {
        level: 2,
        name: "Explorer",
        requiredXP: 100,
        description: "You are exploring VELoop Rewards.",
      },
      {
        level: 3,
        name: "Achiever",
        requiredXP: 300,
        description: "You are making great progress.",
      },
      {
        level: 4,
        name: "Champion",
        requiredXP: 600,
        description: "You are becoming a champion.",
      },
      {
        level: 5,
        name: "Legend",
        requiredXP: 1000,
        description: "You have reached legendary status.",
      },
    ];

    for (const levelData of levels) {
      await LevelConfiguration.findOneAndUpdate(
        { level: levelData.level },
        { $set: levelData },
       { upsert: true, returnDocument: "after", runValidators: true }
      );
    }

    console.log("Default Levels Added Successfully!");

  } catch (error) {
    console.error("Level Seeding Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB Disconnected");
  }
};

seedLevels();
