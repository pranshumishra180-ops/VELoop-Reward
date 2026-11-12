
import ActivityLog from "../models/activityLog.model.js";

// Create Activity Log
export const createActivityLog = async (
  userId,
  activityType,
  description,
  metadata = {}
) => {
  try {
    const activity = await ActivityLog.create({
      userId,
      activityType,
      description,
      metadata,
    });

    return activity;
  } catch (error) {
    console.error("Create Activity Log Error:", error);
    throw error;
  }
};

// Get User Activity Logs
export const getUserActivityLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10)
    );

    const skip = (page - 1) * limit;

    const filter = {
      userId: req.user._id,
    };

    const [activities, totalActivities] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      ActivityLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "User activity logs fetched successfully",
      pagination: {
        totalActivities,
        currentPage: page,
        totalPages: Math.ceil(totalActivities / limit),
        limit,
      },
      activities,
    });
  } catch (error) {
    console.error("Get User Activity Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
