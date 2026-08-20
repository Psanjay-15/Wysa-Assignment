import { Router } from "express";
import {
  answerQuestion,
  startConversation,
} from "../controllers/conversation.controller.js";
import {
  getConversationHistory,
  getCurrentQuestion,
} from "../controllers/conversation-read.controller.js";
import verifyJWT from "../middlewares/verify-jwt.js";

const router = Router();

router.post("/start", verifyJWT, startConversation);
router.get("/:conversationId/current", verifyJWT, getCurrentQuestion);
router.get("/:conversationId/history", verifyJWT, getConversationHistory);
router.get(
  "/:conversationId/modules/:moduleId/questions/:questionId",
  verifyJWT,
  getCurrentQuestion,
);
router.post("/:conversationId/answers", verifyJWT, answerQuestion);

export default router;
