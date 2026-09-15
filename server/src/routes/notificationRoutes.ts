// src/routes/notificationRoutes.ts
import { Router } from "express";
import { getUserNotifications, markNotificationsAsRead } from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/auth.js"; // Your auth middleware

const router = Router();

router.use(verifyToken);

router.get("/", getUserNotifications);
router.patch("/read", markNotificationsAsRead);

export default router;