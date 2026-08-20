import { Router } from "express";
import { startConversation } from "../controllers/conversation.controller.js";
import verifyJWT from "../middlewares/verify-jwt.js";

const router = Router();

router.post("/start", verifyJWT, startConversation);

export default router;
