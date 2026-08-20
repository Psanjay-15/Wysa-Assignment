import Flow from "../models/flow.model.js";
import validateFlow from "./validate-flow.js";

const validateStoredFlows = async () => {
  const flows = await Flow.find().lean();

  if (flows.length === 0) {
    console.warn("No conversation flows found. Run: npm run seed:flow");
    return;
  }

  const invalidFlows = [];

  for (const flow of flows) {
    const errors = validateFlow(flow);

    if (errors.length > 0) {
      invalidFlows.push(
        `${flow.flowId} version ${flow.version}: ${errors.join("; ")}`,
      );
    }
  }

  if (invalidFlows.length > 0) {
    throw new Error(`Invalid stored flow: ${invalidFlows.join(" | ")}`);
  }

  console.log(`${flows.length} stored conversation flow(s) validated`);
};

export default validateStoredFlows;
