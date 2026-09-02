import { Router } from "express";
import { handleSignup, handleLogin, handleLogout, handleGetMe } from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();
router.post("/signup", handleSignup);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);
router.get("/me", verifyToken, handleGetMe);

export default router;