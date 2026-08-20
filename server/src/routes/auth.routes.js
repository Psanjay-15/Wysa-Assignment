import { Router } from "express";
import {
  getCurrentUser,
  login,
  register,
} from "../controllers/auth.controller.js";
import verifyJWT from "../middlewares/verify-jwt.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyJWT, getCurrentUser);

export default router;
