import mongoose from "mongoose";
import validateFlow from "../utils/validate-flow.js";

const optionSchema = new mongoose.Schema(
  {
    optionId: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    next: {
      type: {
        type: String,
        required: true,
        enum: ["question", "complete"],
      },
      moduleId: String,
      questionId: String,
    },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    isCheckpoint: { type: Boolean, default: false },
    options: { type: [optionSchema], required: true },
  },
  { _id: false },
);

const moduleSchema = new mongoose.Schema(
  {
    moduleId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    startQuestionId: { type: String, required: true },
    questions: { type: [questionSchema], required: true },
  },
  { _id: false },
);

const flowSchema = new mongoose.Schema(
  {
    flowId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    version: { type: Number, required: true, default: 1, min: 1 },
    modules: { type: [moduleSchema], required: true },
  },
  { timestamps: true },
);

flowSchema.index({ flowId: 1, version: 1 }, { unique: true });

flowSchema.pre("validate", function validateReferences() {
  const errors = validateFlow(this.toObject());

  if (errors.length > 0) {
    this.invalidate("modules", errors.join("; "));
  }
});

const Flow = mongoose.model("Flow", flowSchema);

export default Flow;
