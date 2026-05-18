import { Router } from "express";
import {
  handleWebhook,
  linkLineUser,
} from "../controllers/webhook.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware";

const router = Router();

router.post("/", handleWebhook);
router.post("/link", auth, allowRoles("OWNER", "STAFF"), linkLineUser);

export default router;
