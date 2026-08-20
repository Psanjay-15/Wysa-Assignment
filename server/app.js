import cors from "cors";
import express from "express";
import routes from "./src/routes/routes.js";
const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    project: "Wysa Conversation Flow",
    message: "Wysa Conversation Flow API is running",
  });
});

app.use(routes);

export default app;
