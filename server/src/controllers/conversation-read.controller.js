import mongoose from "mongoose";
import ConversationHistory from "../models/conversation-history.model.js";
import Conversation from "../models/conversation.model.js";
import Flow from "../models/flow.model.js";
import formatQuestion from "../utils/format-question.js";

export const getCurrentQuestion = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.conversationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid conversation ID",
    });
  }

  const conversation = await Conversation.findOne({
    _id: req.params.conversationId,
    userId: req.user._id,
  });

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  const isDeepLink = Boolean(req.params.moduleId && req.params.questionId);
  const requestedQuestion = isDeepLink
    ? {
        moduleId: req.params.moduleId,
        questionId: req.params.questionId,
      }
    : undefined;

  if (conversation.status === "completed") {
    return res.status(200).json({
      success: true,
      message: "Conversation is completed",
      data: {
        conversationId: conversation._id,
        status: conversation.status,
        stateVersion: conversation.stateVersion,
        stale: isDeepLink,
        requestedQuestion,
        currentModuleId: null,
        canGoBack: false,
        question: null,
      },
    });
  }

  const flow = await Flow.findById(conversation.flow);
  const currentModule = flow?.modules.find(
    (module) => module.moduleId === conversation.currentModuleId,
  );
  const currentQuestion = currentModule?.questions.find(
    (question) => question.questionId === conversation.currentQuestionId,
  );
  const currentModuleState = conversation.moduleStates.find(
    (state) => state.moduleId === conversation.currentModuleId,
  );

  if (!flow || !currentModule || !currentQuestion || !currentModuleState) {
    return res.status(500).json({
      success: false,
      message: "The conversation flow has a broken question reference",
    });
  }

  const stale = isDeepLink
    ? req.params.moduleId !== conversation.currentModuleId ||
      req.params.questionId !== conversation.currentQuestionId
    : false;

  return res.status(200).json({
    success: true,
    message: stale
      ? "The requested question is stale. Returning the current question"
      : "Current question returned successfully",
    data: {
      conversationId: conversation._id,
      status: conversation.status,
      stateVersion: conversation.stateVersion,
      stale,
      requestedQuestion,
      currentModuleId: conversation.currentModuleId,
      canGoBack:
        conversation.navigationStack.length > 0
          ? conversation.navigationStack.length > 1
          : currentModuleState.questionPath.length > 1,
      question: formatQuestion(currentQuestion),
    },
  });
};

export const getConversationHistory = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.conversationId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid conversation ID",
    });
  }

  const conversation = await Conversation.findOne({
    _id: req.params.conversationId,
    userId: req.user._id,
  }).select("status stateVersion");

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  const events = await ConversationHistory.find({
    conversationId: conversation._id,
    userId: req.user._id,
  })
    .select("-_id -__v -conversationId -userId")
    .sort({ stateVersion: 1, eventOrder: 1, createdAt: 1 })
    .lean();

  return res.status(200).json({
    success: true,
    message: "Conversation history returned successfully",
    data: {
      conversationId: conversation._id,
      status: conversation.status,
      stateVersion: conversation.stateVersion,
      events,
    },
  });
};
