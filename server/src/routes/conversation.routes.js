import { Router } from "express";
import {
  answerQuestion,
  startConversation,
} from "../controllers/conversation.controller.js";
import verifyJWT from "../middlewares/verify-jwt.js";

const router = Router();

router.post("/start", verifyJWT, startConversation);
router.post("/:conversationId/answers", verifyJWT, answerQuestion);

export default router;
