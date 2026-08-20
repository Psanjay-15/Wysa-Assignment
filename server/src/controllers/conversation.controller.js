import mongoose from "mongoose";
import ConversationHistory from "../models/conversation-history.model.js";
import Conversation from "../models/conversation.model.js";
import Flow from "../models/flow.model.js";
import formatQuestion from "../utils/format-question.js";

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
        canGoBack: false,
        question: formatQuestion(question),
      },
    });
  } finally {
    await session.endSession();
  }
};

export const answerQuestion = async (req, res) => {
  const { questionId, optionId, expectedStateVersion } = req.body || {};

  if (
    typeof questionId !== "string" ||
    typeof optionId !== "string" ||
    !Number.isInteger(expectedStateVersion) ||
    expectedStateVersion < 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Question ID, option ID and expected state version are required",
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
      message: "This conversation is already completed",
    });
  }

  if (
    conversation.stateVersion !== expectedStateVersion ||
    conversation.currentQuestionId !== questionId
  ) {
    return res.status(409).json({
      success: false,
      message: "This question is stale. Continue from the current question",
      data: {
        currentModuleId: conversation.currentModuleId,
        currentQuestionId: conversation.currentQuestionId,
        stateVersion: conversation.stateVersion,
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

  if (!flow || !currentModule || !currentQuestion) {
    return res.status(500).json({
      success: false,
      message: "The conversation flow has a broken question reference",
    });
  }

  const selectedOption = currentQuestion.options.find(
    (option) => option.optionId === optionId,
  );

  if (!selectedOption) {
    return res.status(422).json({
      success: false,
      message: "This option does not belong to the current question",
    });
  }

  let nextModule;
  let nextQuestion;

  if (selectedOption.next.type === "question") {
    nextModule = flow.modules.find(
      (module) => module.moduleId === selectedOption.next.moduleId,
    );
    nextQuestion = nextModule?.questions.find(
      (question) => question.questionId === selectedOption.next.questionId,
    );

    if (!nextModule || !nextQuestion) {
      return res.status(500).json({
        success: false,
        message: "The selected option has a broken next-question reference",
      });
    }
  }

  const now = new Date();
  const oldSegmentNumber = conversation.moduleStates.find(
    (state) => state.moduleId === conversation.currentModuleId,
  )?.segmentNumber;

  if (!oldSegmentNumber) {
    return res.status(500).json({
      success: false,
      message: "The conversation has an invalid active module state",
    });
  }

  const moduleStates = conversation.moduleStates.map((state) =>
    state.toObject(),
  );
  const currentModuleState = moduleStates.find(
    (state) => state.moduleId === conversation.currentModuleId,
  );

  currentModuleState.answers.push({ questionId, optionId, answeredAt: now });

  if (currentQuestion.isCheckpoint) {
    currentModuleState.segmentNumber += 1;
    currentModuleState.answers = [];
    currentModuleState.questionPath = [];
  }

  let status = "active";
  let currentModuleId = conversation.currentModuleId;
  let currentQuestionId = conversation.currentQuestionId;

  if (selectedOption.next.type === "complete") {
    status = "completed";
    currentModuleState.status = "completed";
  } else if (nextModule.moduleId === conversation.currentModuleId) {
    currentQuestionId = nextQuestion.questionId;
    currentModuleState.currentQuestionId = nextQuestion.questionId;
    currentModuleState.questionPath.push(nextQuestion.questionId);
  } else {
    currentModuleState.status = "suspended";
    currentModuleId = nextModule.moduleId;
    currentQuestionId = nextQuestion.questionId;

    let nextModuleState = moduleStates.find(
      (state) => state.moduleId === nextModule.moduleId,
    );

    if (nextModuleState) {
      nextModuleState.status = "active";
      nextModuleState.currentQuestionId = nextQuestion.questionId;
      nextModuleState.questionPath.push(nextQuestion.questionId);
    } else {
      nextModuleState = {
        moduleId: nextModule.moduleId,
        status: "active",
        currentQuestionId: nextQuestion.questionId,
        segmentNumber: 1,
        answers: [],
        questionPath: [nextQuestion.questionId],
      };
      moduleStates.push(nextModuleState);
    }
  }

  const newStateVersion = expectedStateVersion + 1;
  const historyEvents = [
    {
      conversationId: conversation._id,
      userId: req.user._id,
      eventType: "ANSWER_ACCEPTED",
      stateVersion: newStateVersion,
      eventOrder: 1,
      moduleId: conversation.currentModuleId,
      questionId,
      optionId,
      toModuleId: nextModule?.moduleId,
      toQuestionId: nextQuestion?.questionId,
      segmentNumber: oldSegmentNumber,
    },
  ];

  let eventOrder = 2;

  if (currentQuestion.isCheckpoint) {
    historyEvents.push({
      conversationId: conversation._id,
      userId: req.user._id,
      eventType: "CHECKPOINT_RESET",
      stateVersion: newStateVersion,
      eventOrder: eventOrder++,
      moduleId: conversation.currentModuleId,
      questionId,
      segmentNumber: currentModuleState.segmentNumber,
    });
  }

  if (nextModule && nextModule.moduleId !== conversation.currentModuleId) {
    historyEvents.push({
      conversationId: conversation._id,
      userId: req.user._id,
      eventType: "MODULE_TRANSITIONED",
      stateVersion: newStateVersion,
      eventOrder: eventOrder++,
      fromModuleId: conversation.currentModuleId,
      fromQuestionId: questionId,
      toModuleId: nextModule.moduleId,
      toQuestionId: nextQuestion.questionId,
    });
  }

  if (status === "completed") {
    historyEvents.push({
      conversationId: conversation._id,
      userId: req.user._id,
      eventType: "CONVERSATION_COMPLETED",
      stateVersion: newStateVersion,
      eventOrder,
      moduleId: conversation.currentModuleId,
      questionId,
      optionId,
      segmentNumber: currentModuleState.segmentNumber,
    });
  }

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
          currentQuestionId: questionId,
        },
        {
          $set: {
            status,
            currentModuleId,
            currentQuestionId,
            stateVersion: newStateVersion,
            moduleStates,
            completedAt: status === "completed" ? now : null,
          },
        },
        { returnDocument: "after", runValidators: true, session },
      );

      if (updatedConversation) {
        await ConversationHistory.create(historyEvents, {
          session,
          ordered: true,
        });
      }
    });

    if (!updatedConversation) {
      const latestConversation = await Conversation.findById(conversation._id);

      return res.status(409).json({
        success: false,
        message: "The conversation changed before this answer was saved",
        data: {
          currentModuleId: latestConversation?.currentModuleId,
          currentQuestionId: latestConversation?.currentQuestionId,
          stateVersion: latestConversation?.stateVersion,
        },
      });
    }

    if (status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Conversation completed successfully",
        data: {
          conversationId: updatedConversation._id,
          status: updatedConversation.status,
          stateVersion: updatedConversation.stateVersion,
          canGoBack: false,
          question: null,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Answer accepted",
      data: {
        conversationId: updatedConversation._id,
        status: updatedConversation.status,
        stateVersion: updatedConversation.stateVersion,
        moduleId: nextModule.moduleId,
        canGoBack:
          moduleStates.find((state) => state.moduleId === nextModule.moduleId)
            ?.questionPath.length > 1,
        question: formatQuestion(nextQuestion),
      },
    });
  } finally {
    await session.endSession();
  }
};
