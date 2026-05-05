import { Router } from "express";
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
} from "../controllers/service.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", auth, getServices);
router.get("/:id", auth, getService);
router.post("/", auth, allowRoles("OWNER"), createService);
router.put("/:id", auth, allowRoles("OWNER"), updateService);
router.delete("/:id", auth, allowRoles("OWNER"), deleteService);

export default router;
