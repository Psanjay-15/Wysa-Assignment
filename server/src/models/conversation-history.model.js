import mongoose from "mongoose";

const conversationHistorySchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "CONVERSATION_STARTED",
        "ANSWER_ACCEPTED",
        "MODULE_TRANSITIONED",
        "CHECKPOINT_RESET",
        "CONVERSATION_COMPLETED",
        "BACK_NAVIGATED",
      ],
    },
    stateVersion: { type: Number, required: true },
    moduleId: String,
    questionId: String,
    optionId: String,
    fromModuleId: String,
    fromQuestionId: String,
    toModuleId: String,
    toQuestionId: String,
    segmentNumber: Number,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

conversationHistorySchema.index({ conversationId: 1, createdAt: 1 });

const ConversationHistory = mongoose.model(
  "ConversationHistory",
  conversationHistorySchema,
);

export default ConversationHistory;
