import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../db/index.js";
import Flow from "../models/flow.model.js";
import sampleFlow from "./sample-flow.js";

const seedFlow = async () => {
  try {
    await connectDB();

    const existingFlow = await Flow.findOne({
      flowId: sampleFlow.flowId,
      version: sampleFlow.version,
    });

    if (existingFlow) {
      existingFlow.set(sampleFlow);
      await existingFlow.save();
      console.log("Sample flow updated successfully");
    } else {
      await Flow.create(sampleFlow);
      console.log("Sample flow created successfully");
    }
  } catch (error) {
    console.error("Flow seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void seedFlow();
