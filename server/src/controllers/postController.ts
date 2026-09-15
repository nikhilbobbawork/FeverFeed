import type { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { connectToDatabase, sendNotificationToUser } from "../server.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { getNotificationCollection } from "../models/Notification.js";

// Get All Posts (Public)
export const handleGetPosts: RequestHandler = async (req, res) => {
  try {
    const { sort } = req.query;
    const db = await connectToDatabase();
    const postsCollection = db.collection("posts");

    // Determine sort strategy (Default to latest)
    let sortOption: { [key: string]: 1 | -1 } = { createdAt: -1 };

    if (sort === "top") {
      sortOption = { upvoteCount: -1, createdAt: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const posts = await postsCollection.find({}).sort(sortOption).toArray();

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, error: "Failed to fetch posts." });
  }
};

// Get Single Post by ID (Public)
export const handleGetPostById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid post ID format" });
      return;
    }

    const db = await connectToDatabase();
    const post = await db
      .collection("posts")
      .findOne({ _id: new ObjectId(id) });

    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

// Create New Post (Protected)
export const handleCreatePost = async (
  req: AuthenticatedRequest,
  res: Parameters<RequestHandler>[1]
) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: "Title and content are required" });
      return;
    }

    const imageUrl = req.file
      ? `/static/uploads/${req.file.filename}`
      : null;

    const db = await connectToDatabase();
    const userId = req.user?.id;

    const newPost = {
      title,
      content,
      imageUrl,
      authorId: userId,
      authorEmail: req.user?.email,
      upvotes: [],
      upvoteCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("posts").insertOne(newPost);

    res.status(201).json({
      message: "Post created successfully",
      post: { _id: result.insertedId.toString(), ...newPost },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update Post (Protected - Owner Only)
export const handleUpdatePost = async (
  req: AuthenticatedRequest,
  res: Parameters<RequestHandler>[1]
) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid post ID format" });
      return;
    }

    const db = await connectToDatabase();
    const postsCollection = db.collection("posts");

    const existingPost = await postsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingPost) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    if (existingPost.authorId !== userId) {
      res.status(403).json({ error: "Unauthorized to edit this post" });
      return;
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (req.file) updateData.imageUrl = `/static/uploads/${req.file.filename}`;

    await postsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.status(200).json({ message: "Post updated successfully" });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete Post (Protected - Owner Only)
export const handleDeletePost = async (
  req: AuthenticatedRequest,
  res: Parameters<RequestHandler>[1]
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid post ID format" });
      return;
    }

    const db = await connectToDatabase();
    const postsCollection = db.collection("posts");

    const existingPost = await postsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingPost) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    if (existingPost.authorId !== userId) {
      res.status(403).json({ error: "Unauthorized to delete this post" });
      return;
    }

    await postsCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Toggle Upvote on Post (Protected)
export const handleToggleUpvote = async (
  req: AuthenticatedRequest,
  res: Parameters<RequestHandler>[1]
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid post ID format" });
      return;
    }

    const db = await connectToDatabase();
    const postsCollection = db.collection("posts");

    const post = await postsCollection.findOne({ _id: new ObjectId(id) });

    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const upvotes: string[] = post.upvotes || [];
    const hasUpvoted = upvotes.includes(userId);

    const updateQuery = hasUpvoted
      ? { $pull: { upvotes: userId }, $inc: { upvoteCount: -1 } }
      : { $addToSet: { upvotes: userId }, $inc: { upvoteCount: 1 } };

    await postsCollection.updateOne(
      { _id: new ObjectId(id) },
      updateQuery as any
    );

    const updatedPost = await postsCollection.findOne({ _id: new ObjectId(id) });

    // --- NOTIFICATION TRIGGER LOGIC ---
    // Extract safe string versions of authorId and current userId to handle ObjectId vs String mismatches
    const authorIdStr = post.authorId ? post.authorId.toString() : null;
    const currentUserIdStr = userId.toString();

    // Only notify if upvoting (not downvoting) and not upvoting own post
    if (!hasUpvoted && authorIdStr && authorIdStr !== currentUserIdStr) {
      const notificationsCollection = await getNotificationCollection();

      const newNotification = {
        recipientId: new ObjectId(authorIdStr),
        senderId: new ObjectId(currentUserIdStr),
        type: "LIKE" as const,
        postId: new ObjectId(id),
        isRead: false,
        createdAt: new Date(),
      };

      const result = await notificationsCollection.insertOne(newNotification);

      // Fetch sender details to send a fully populated notification payload over sockets
      const sender = await db.collection("users").findOne(
        { _id: new ObjectId(currentUserIdStr) },
        { projection: { username: 1, email: 1 } }
      );

      sendNotificationToUser(authorIdStr, {
        _id: result.insertedId.toString(),
        ...newNotification,
        postTitle: post.title,
        sender: sender || { email: req.user?.email },
      });
    }

    res.status(200).json({
      success: true,
      upvoteCount: updatedPost?.upvoteCount ?? 0,
      hasUpvoted: !hasUpvoted,
    });
  } catch (error) {
    console.error("Error toggling upvote:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};