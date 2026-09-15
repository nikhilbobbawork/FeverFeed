// src/controllers/notificationController.ts
import type { Response } from "express";
import { ObjectId } from "mongodb";
import { getNotificationCollection } from "../models/Notification.js";
import type { AuthenticatedRequest } from "../middleware/auth.js"; // Import custom request interface

// GET /api/notifications
export async function getUserNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const collection = await getNotificationCollection();

    // Fetch notifications and aggregate sender details
    const notifications = await collection
      .aggregate([
        { $match: { recipientId: new ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        { $limit: 30 },
        {
          $lookup: {
            from: "users",
            localField: "senderId",
            foreignField: "_id",
            as: "sender",
            pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }],
          },
        },
        { $unwind: "$sender" },
      ])
      .toArray();

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
}

// PATCH /api/notifications/read
export async function markNotificationsAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const collection = await getNotificationCollection();

    await collection.updateMany(
      { recipientId: new ObjectId(userId), isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ success: false, error: "Failed to update notifications" });
  }
}