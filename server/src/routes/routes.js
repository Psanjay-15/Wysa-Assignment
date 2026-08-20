import express from "express";
import authRoutes from "./auth.routes.js";
import conversationRoutes from "./conversation.routes.js";

const router = express.Router();

router.use("/api/auth", authRoutes);
router.use("/api/conversations", conversationRoutes);

export default router;
