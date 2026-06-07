import { Router } from "express";
import { login, getMe } from "../controllers/auth.controller.js";
import auth from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema } from "../utils/schemas.js";

const router = Router();

router.post("/login", validate(loginSchema),login);
router.get("/me", auth, getMe);

export default router;
