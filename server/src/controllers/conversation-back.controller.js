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
  let navigationStack = conversation.navigationStack.map((position) =>
    position.toObject(),
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

  if (navigationStack.length === 0) {
    navigationStack = currentModuleState.questionPath.map((questionId) => ({
      moduleId: currentModuleState.moduleId,
      questionId,
      segmentNumber: currentModuleState.segmentNumber,
    }));
  }

  const currentPosition = navigationStack.at(-1);

  if (
    currentPosition?.moduleId !== conversation.currentModuleId ||
    currentPosition?.questionId !== conversation.currentQuestionId ||
    currentPosition?.segmentNumber !== currentModuleState.segmentNumber
  ) {
    return res.status(500).json({
      success: false,
      message: "The conversation has an invalid navigation state",
    });
  }

  if (navigationStack.length < 2) {
    return res.status(409).json({
      success: false,
      message: "There is no previous question in the current conversation state",
      data: {
        currentModuleId: conversation.currentModuleId,
        currentQuestionId: conversation.currentQuestionId,
        stateVersion: conversation.stateVersion,
      },
    });
  }

  const previousPosition = navigationStack.at(-2);
  const previousModuleState = moduleStates.find(
    (state) => state.moduleId === previousPosition.moduleId,
  );
  const sameModule = previousPosition.moduleId === conversation.currentModuleId;
  const expectedPreviousQuestionId = sameModule
    ? currentModuleState.questionPath.at(-2)
    : previousModuleState?.questionPath.at(-1);

  if (
    !previousModuleState ||
    previousModuleState.segmentNumber !== previousPosition.segmentNumber ||
    expectedPreviousQuestionId !== previousPosition.questionId
  ) {
    return res.status(409).json({
      success: false,
      message: "Back navigation cannot cross an inactive checkpoint segment",
    });
  }

  const revertedAnswer = previousModuleState.answers.at(-1);

  if (
    !revertedAnswer ||
    revertedAnswer.questionId !== previousPosition.questionId
  ) {
    return res.status(500).json({
      success: false,
      message: "The conversation does not have a valid previous answer",
    });
  }

  const flow = await Flow.findById(conversation.flow);
  const previousModule = flow?.modules.find(
    (module) => module.moduleId === previousPosition.moduleId,
  );
  const previousQuestion = previousModule?.questions.find(
    (question) => question.questionId === previousPosition.questionId,
  );

  if (!flow || !previousModule || !previousQuestion) {
    return res.status(500).json({
      success: false,
      message: "The conversation flow has a broken previous-question reference",
    });
  }

  const fromQuestionId = conversation.currentQuestionId;
  currentModuleState.questionPath.pop();
  currentModuleState.currentQuestionId =
    currentModuleState.questionPath.at(-1) || fromQuestionId;
  previousModuleState.answers.pop();
  previousModuleState.currentQuestionId = previousPosition.questionId;

  if (!sameModule) {
    currentModuleState.status = "suspended";
    previousModuleState.status = "active";
  }

  navigationStack.pop();

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
            currentModuleId: previousPosition.moduleId,
            currentQuestionId: previousPosition.questionId,
            stateVersion: newStateVersion,
            moduleStates,
            navigationStack,
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
              moduleId: previousPosition.moduleId,
              questionId: previousPosition.questionId,
              optionId: revertedAnswer.optionId,
              fromModuleId: conversation.currentModuleId,
              fromQuestionId,
              toModuleId: previousPosition.moduleId,
              toQuestionId: previousPosition.questionId,
              segmentNumber: previousModuleState.segmentNumber,
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
        canGoBack: navigationStack.length > 1,
        previousOptionId: revertedAnswer.optionId,
        question: formatQuestion(previousQuestion),
      },
    });
  } finally {
    await session.endSession();
  }
};
