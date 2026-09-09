// controllers/commentController.ts
import type { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../server.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

// Get Comments for a Post (Public)
export const handleGetComments: RequestHandler = async (req, res) => {
  try {
    // Force string type from req.params
    const postId = Array.isArray(req.params.postId)
      ? req.params.postId[0]
      : req.params.postId;

    if (!postId || !ObjectId.isValid(postId)) {
      res.status(400).json({ error: "Invalid post ID" });
      return;
    }

    const db = await connectToDatabase();
    const comments = await db
      .collection("comments")
      .find({ postId: postId }) // or new ObjectId(postId) if storing as ObjectId
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add Comment to Post (Protected)
export const handleCreateComment = async (
  req: AuthenticatedRequest,
  res: Parameters<RequestHandler>[1],
) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ error: "Comment text cannot be empty" });
      return;
    }

    const db = await connectToDatabase();
    const newComment = {
      postId,
      authorId: userId,
      authorEmail: userEmail,
      content: content.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection("comments").insertOne(newComment);

    res.status(201).json({
      success: true,
      comment: { _id: result.insertedId.toString(), ...newComment },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// controllers/commentController.ts

export const handleDeleteComment = async (
  req: AuthenticatedRequest,
  res: Parameters<RequestHandler>[1],
) => {
  try {
    const userId = req.user?.id;

    const commentIdParam = req.params.commentId;
    const commentId = Array.isArray(commentIdParam)
      ? commentIdParam[0]
      : commentIdParam;

    if (!commentId || !ObjectId.isValid(commentId)) {
      res.status(400).json({ error: "Invalid comment ID" });
      return;
    }

    const objectId = new ObjectId(commentId);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!commentId || !ObjectId.isValid(commentId)) {
      res.status(400).json({ error: "Invalid comment ID" });
      return;
    }

    const db = await connectToDatabase();
    const comment = await db
      .collection("comments")
      .findOne({ _id: new ObjectId(commentId) });

    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    // Ownership check
    if (comment.authorId !== userId) {
      res
        .status(403)
        .json({ error: "Forbidden: You can only delete your own comments" });
      return;
    }

    await db.collection("comments").deleteOne({ _id: new ObjectId(commentId) });

    res
      .status(200)
      .json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
