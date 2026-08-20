import "dotenv/config";
import app from "./app.js";
import connectDB from "./src/db/index.js";
import validateStoredFlows from "./src/utils/validate-stored-flows.js";

const port = Number(process.env.PORT) || 8000;

const startServer = async () => {
  try {
    await connectDB();
    await validateStoredFlows();

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
};

void startServer();
