// src/controllers/userController.ts
import type { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { connectToDatabase, sendNotificationToUser } from "../server.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getNotificationCollection } from "../models/Notification.js";

const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawParam = req.params.username;
    const usernameParam = Array.isArray(rawParam) ? rawParam[0] : rawParam;

    if (!usernameParam) {
      res.status(400).json({ error: "Username parameter is required." });
      return;
    }

    const decoded = decodeURIComponent(usernameParam).trim();
    const safeRegex = new RegExp(`^${escapeRegex(decoded)}$`, "i");

    const db = await connectToDatabase();

    // 1. Get user (minimal projection)
    const user = await db.collection("users").findOne(
      { $or: [{ username: safeRegex }, { email: safeRegex }] },
      { projection: { password: 0, email: 0 } }
    );

    if (!user) {
      res.status(404).json({ error: "User profile not found." });
      return;
    }

    const userIdStr = user._id.toString();

    // 2. Get posts (Only fetch UI-required fields)
    const posts = await db.collection("posts")
      .find({ authorId: userIdStr })
      .project({ title: 1, content: 1, createdAt: 1, upvoteCount: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    // 3. Get raw comments (Only fetch UI-required fields)
    const rawComments = await db.collection("comments")
      .find({ authorId: userIdStr })
      .project({ content: 1, createdAt: 1, postId: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    // 4. Map post titles for comments efficiently
    const postIds = [...new Set(
      rawComments
        .map(c => c.postId)
        .filter(id => id && ObjectId.isValid(id))
        .map(id => new ObjectId(id))
    )];

    const referencedPosts = postIds.length > 0 
      ? await db.collection("posts")
          .find({ _id: { $in: postIds } })
          .project({ title: 1 })
          .toArray()
      : [];

    const postMap = new Map(referencedPosts.map(p => [p._id.toString(), p.title]));

    // 5. Final assembly
    const comments = rawComments.map(c => ({
      _id: c._id.toString(),
      content: c.content,
      createdAt: c.createdAt,
      post: c.postId ? {
        _id: c.postId,
        title: postMap.get(c.postId) || "Discussion Post"
      } : undefined
    }));

    res.status(200).json({
      user,
      posts,
      comments,
      stats: {
        totalPosts: posts.length,
        totalComments: comments.length,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error in getUserProfile controller:", error);
    res.status(500).json({ error: "Could not load user profile." });
  }
};

// Toggle Follow/Unfollow User (Protected)
export const handleToggleFollowUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { targetUserId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!targetUserId || typeof targetUserId !== "string" || !ObjectId.isValid(targetUserId)) {
      res.status(400).json({ error: "Invalid target user ID format" });
      return;
    }

    if (currentUserId === targetUserId) {
      res.status(400).json({ error: "You cannot follow yourself" });
      return;
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection("users");

    const targetUser = await usersCollection.findOne({ _id: new ObjectId(targetUserId) });
    if (!targetUser) {
      res.status(404).json({ error: "User to follow not found" });
      return;
    }

    const followers: string[] = targetUser.followers || [];
    const isFollowing = followers.includes(currentUserId);

    if (isFollowing) {
      // Unfollow logic
      await usersCollection.updateOne(
        { _id: new ObjectId(targetUserId) },
        { $pull: { followers: currentUserId } as any }
      );
      await usersCollection.updateOne(
        { _id: new ObjectId(currentUserId) },
        { $pull: { following: targetUserId } as any }
      );
    } else {
      // Follow logic
      await usersCollection.updateOne(
        { _id: new ObjectId(targetUserId) },
        { $addToSet: { followers: currentUserId } as any }
      );
      await usersCollection.updateOne(
        { _id: new ObjectId(currentUserId) },
        { $addToSet: { following: targetUserId } as any }
      );

      // --- NOTIFICATION TRIGGER LOGIC ---
      const notificationsCollection = await getNotificationCollection();

      const newNotification = {
        recipientId: new ObjectId(targetUserId),
        senderId: new ObjectId(currentUserId),
        type: "FOLLOW" as const,
        isRead: false,
        createdAt: new Date(),
      };

      const result = await notificationsCollection.insertOne(newNotification);

      // Fetch current user details to send full payload
      const currentUserDoc = await usersCollection.findOne(
        { _id: new ObjectId(currentUserId) },
        { projection: { username: 1, avatar: 1 } }
      );

      sendNotificationToUser(targetUserId, {
        _id: result.insertedId.toString(),
        ...newNotification,
        sender: currentUserDoc || { username: req.user?.email || "Someone" },
      });
    }

    res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
      message: isFollowing ? "Unfollowed user successfully" : "Followed user successfully",
    });
  } catch (error) {
    console.error("Error toggling follow status:", error);
    res.status(500).json({ error: "Failed to update follow status" });
  }
};