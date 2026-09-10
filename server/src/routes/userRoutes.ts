// src/routes/userRoutes.ts
import { Router } from "express";
import { getUserProfile } from "../controllers/userController.js";

const router = Router();

// Public endpoint to view any profile by username
router.get("/:username", getUserProfile);

export default router;