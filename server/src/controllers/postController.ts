import type { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../server.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

// Get All Posts (Public)
export const handleGetPosts: RequestHandler = async (_req, res) => {
  try {
    const db = await connectToDatabase();
    const posts = await db
      .collection("posts")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to retrieve posts" });
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
    const newPost = {
      title,
      content,
      imageUrl,
      authorId: req.user?.id,
      authorEmail: req.user?.email,
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

    if (existingPost.authorId !== req.user?.id) {
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

    if (existingPost.authorId !== req.user?.id) {
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