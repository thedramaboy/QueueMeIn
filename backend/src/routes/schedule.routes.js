import { Router } from "express";
import {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/schedule.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createScheduleSchema } from "../schemas/schedule.schema.js";

const router = Router();

router.get("/", auth, getSchedules);
router.get("/:id", auth, getSchedule);
router.post("/", auth, allowRoles("OWNER"),validate(createScheduleSchema), createSchedule);
router.put("/:id", auth, allowRoles("OWNER"), updateSchedule);
router.delete("/:id", auth, allowRoles("OWNER"), deleteSchedule);

export default router;
