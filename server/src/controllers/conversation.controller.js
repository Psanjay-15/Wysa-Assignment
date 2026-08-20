import mongoose from "mongoose";
import ConversationHistory from "../models/conversation-history.model.js";
import Conversation from "../models/conversation.model.js";
import Flow from "../models/flow.model.js";

export const startConversation = async (req, res) => {
  const { flowId, moduleId } = req.body || {};

  if (!flowId || !moduleId) {
    return res.status(400).json({
      success: false,
      message: "Flow ID and module ID are required",
    });
  }

  const flow = await Flow.findOne({ flowId }).sort({ version: -1 });

  if (!flow) {
    return res.status(404).json({
      success: false,
      message: "Flow not found",
    });
  }

  const module = flow.modules.find((item) => item.moduleId === moduleId);

  if (!module) {
    return res.status(404).json({
      success: false,
      message: "Module not found in this flow",
    });
  }

  const question = module.questions.find(
    (item) => item.questionId === module.startQuestionId,
  );

  if (!question) {
    return res.status(500).json({
      success: false,
      message: "The module does not have a valid starting question",
    });
  }

  const session = await mongoose.startSession();
  let conversation;

  try {
    await session.withTransaction(async () => {
      [conversation] = await Conversation.create(
        [
          {
            userId: req.user._id,
            flow: flow._id,
            flowId: flow.flowId,
            flowVersion: flow.version,
            currentModuleId: module.moduleId,
            currentQuestionId: question.questionId,
            moduleStates: [
              {
                moduleId: module.moduleId,
                currentQuestionId: question.questionId,
                questionPath: [question.questionId],
              },
            ],
          },
        ],
        { session },
      );

      await ConversationHistory.create(
        [
          {
            conversationId: conversation._id,
            userId: req.user._id,
            eventType: "CONVERSATION_STARTED",
            stateVersion: conversation.stateVersion,
            toModuleId: module.moduleId,
            toQuestionId: question.questionId,
            segmentNumber: 1,
          },
        ],
        { session },
      );
    });

    return res.status(201).json({
      success: true,
      message: "Conversation started successfully",
      data: {
        conversationId: conversation._id,
        status: conversation.status,
        stateVersion: conversation.stateVersion,
        moduleId: module.moduleId,
        question: {
          questionId: question.questionId,
          text: question.text,
          isCheckpoint: question.isCheckpoint,
          options: question.options.map((option) => ({
            optionId: option.optionId,
            text: option.text,
          })),
        },
      },
    });
  } finally {
    await session.endSession();
  }
};
