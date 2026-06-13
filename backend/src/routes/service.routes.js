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
import { validate } from "../middlewares/validate.middleware.js";
import { createServiceSchema, updateServiceSchema } from "../schemas/service.schema.js";

const router = Router();

router.get("/", auth, getServices);
router.get("/:id", auth, getService);
router.post("/", auth, allowRoles("SUPERUSER", "ADMIN"), validate(createServiceSchema), createService);
router.put("/:id", auth, allowRoles("SUPERUSER", "ADMIN"), validate(updateServiceSchema), updateService);
router.delete("/:id", auth, allowRoles("SUPERUSER", "ADMIN"), deleteService);

export default router;
