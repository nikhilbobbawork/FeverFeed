import { Router } from "express";
import {
  handleGetPosts,
  handleGetPostById,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
  handleToggleUpvote,
} from "../controllers/postController.js";
import {
  handleGetComments,
  handleCreateComment,
  handleDeleteComment,
} from "../controllers/commentController.js";
import { verifyToken } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Public routes
router.get("/", handleGetPosts);
router.get("/:id", handleGetPostById);

// Protected routes (Requires Auth + File Upload support)
router.post("/", verifyToken, upload.single("image"), handleCreatePost);
router.put("/:id", verifyToken, upload.single("image"), handleUpdatePost);
router.delete("/:id", verifyToken, handleDeletePost);

router.post("/:id/upvote", verifyToken, handleToggleUpvote);
router.get("/:postId/comments", handleGetComments);
router.post("/:postId/comments", verifyToken, handleCreateComment);
router.delete("/comments/:commentId", verifyToken, handleDeleteComment);

export default router;
