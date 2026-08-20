import mongoose from "mongoose";
import ConversationHistory from "../models/conversation-history.model.js";
import Conversation from "../models/conversation.model.js";
import Flow from "../models/flow.model.js";
import formatQuestion from "../utils/format-question.js";

export const navigateBack = async (req, res) => {
  const { expectedStateVersion } = req.body || {};

  if (!Number.isInteger(expectedStateVersion) || expectedStateVersion < 1) {
    return res.status(400).json({
      success: false,
      message: "Expected state version is required",
    });
  }

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

  if (conversation.status === "completed") {
    return res.status(409).json({
      success: false,
      message: "A completed conversation cannot move back",
    });
  }

  if (conversation.stateVersion !== expectedStateVersion) {
    return res.status(409).json({
      success: false,
      message: "The conversation changed before navigation could be saved",
      data: {
        currentModuleId: conversation.currentModuleId,
        currentQuestionId: conversation.currentQuestionId,
        stateVersion: conversation.stateVersion,
      },
    });
  }

  const moduleStates = conversation.moduleStates.map((state) =>
    state.toObject(),
  );
  const currentModuleState = moduleStates.find(
    (state) => state.moduleId === conversation.currentModuleId,
  );

  if (
    !currentModuleState ||
    currentModuleState.status !== "active" ||
    currentModuleState.questionPath.at(-1) !== conversation.currentQuestionId
  ) {
    return res.status(500).json({
      success: false,
      message: "The conversation has an invalid active module state",
    });
  }

  if (currentModuleState.questionPath.length < 2) {
    return res.status(409).json({
      success: false,
      message: "There is no previous question in the current module state",
      data: {
        currentModuleId: conversation.currentModuleId,
        currentQuestionId: conversation.currentQuestionId,
        stateVersion: conversation.stateVersion,
      },
    });
  }

  const previousQuestionId = currentModuleState.questionPath.at(-2);
  const revertedAnswer = currentModuleState.answers.at(-1);

  if (!revertedAnswer || revertedAnswer.questionId !== previousQuestionId) {
    return res.status(500).json({
      success: false,
      message: "The conversation does not have a valid previous answer",
    });
  }

  const flow = await Flow.findById(conversation.flow);
  const currentModule = flow?.modules.find(
    (module) => module.moduleId === conversation.currentModuleId,
  );
  const previousQuestion = currentModule?.questions.find(
    (question) => question.questionId === previousQuestionId,
  );

  if (!flow || !currentModule || !previousQuestion) {
    return res.status(500).json({
      success: false,
      message: "The conversation flow has a broken previous-question reference",
    });
  }

  const fromQuestionId = conversation.currentQuestionId;
  currentModuleState.questionPath.pop();
  currentModuleState.answers.pop();
  currentModuleState.currentQuestionId = previousQuestionId;

  const newStateVersion = expectedStateVersion + 1;
  const session = await mongoose.startSession();
  let updatedConversation;

  try {
    await session.withTransaction(async () => {
      updatedConversation = await Conversation.findOneAndUpdate(
        {
          _id: conversation._id,
          userId: req.user._id,
          status: "active",
          stateVersion: expectedStateVersion,
          currentModuleId: conversation.currentModuleId,
          currentQuestionId: fromQuestionId,
        },
        {
          $set: {
            currentQuestionId: previousQuestionId,
            stateVersion: newStateVersion,
            moduleStates,
          },
        },
        { returnDocument: "after", runValidators: true, session },
      );

      if (updatedConversation) {
        await ConversationHistory.create(
          [
            {
              conversationId: conversation._id,
              userId: req.user._id,
              eventType: "BACK_NAVIGATED",
              stateVersion: newStateVersion,
              eventOrder: 1,
              moduleId: conversation.currentModuleId,
              questionId: previousQuestionId,
              optionId: revertedAnswer.optionId,
              fromModuleId: conversation.currentModuleId,
              fromQuestionId,
              toModuleId: conversation.currentModuleId,
              toQuestionId: previousQuestionId,
              segmentNumber: currentModuleState.segmentNumber,
            },
          ],
          { session },
        );
      }
    });

    if (!updatedConversation) {
      const latestConversation = await Conversation.findById(conversation._id);

      return res.status(409).json({
        success: false,
        message: "The conversation changed before navigation could be saved",
        data: {
          currentModuleId: latestConversation?.currentModuleId,
          currentQuestionId: latestConversation?.currentQuestionId,
          stateVersion: latestConversation?.stateVersion,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Moved to the previous question",
      data: {
        conversationId: updatedConversation._id,
        status: updatedConversation.status,
        stateVersion: updatedConversation.stateVersion,
        moduleId: updatedConversation.currentModuleId,
        canGoBack: currentModuleState.questionPath.length > 1,
        previousOptionId: revertedAnswer.optionId,
        question: formatQuestion(previousQuestion),
      },
    });
  } finally {
    await session.endSession();
  }
};
