import { ObjectId } from "mongodb";
import { connectToDatabase } from "../server.js";

export interface INotification {
  _id?: ObjectId;
  recipientId: ObjectId;  // User receiving the notification
  senderId: ObjectId;     // User triggering the notification
  type: "LIKE" | "COMMENT" | "FOLLOW";
  postId?: ObjectId;      // Related post (if applicable)
  isRead: boolean;
  createdAt: Date;
}

export async function getNotificationCollection() {
  const db = await connectToDatabase();
  return db.collection<INotification>("notifications");
}