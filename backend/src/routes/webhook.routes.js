import { Router } from "express";
import {
  getPendingLineUsers,
  handleWebhook,
  linkLineUser,
} from "../controllers/webhook.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", handleWebhook);
router.get("/pending", auth, getPendingLineUsers);
router.post("/link", auth, allowRoles("OWNER", "STAFF"), linkLineUser);

export default router;
