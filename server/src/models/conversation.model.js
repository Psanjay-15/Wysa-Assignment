import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    optionId: { type: String, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const moduleStateSchema = new mongoose.Schema(
  {
    moduleId: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "suspended", "completed"],
      default: "active",
    },
    currentQuestionId: { type: String, required: true },
    segmentNumber: { type: Number, default: 1 },
    answers: { type: [answerSchema], default: [] },
    questionPath: { type: [String], default: [] },
  },
  { _id: false },
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    flow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flow",
      required: true,
    },
    flowId: { type: String, required: true },
    flowVersion: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    currentModuleId: { type: String, required: true },
    currentQuestionId: { type: String, required: true },
    stateVersion: { type: Number, default: 1 },
    moduleStates: { type: [moduleStateSchema], required: true },
    completedAt: Date,
  },
  { timestamps: true },
);

conversationSchema.index({ userId: 1, status: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
