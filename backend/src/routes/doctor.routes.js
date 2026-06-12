import { Router } from "express";
import {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctor.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createDoctorSchema, updateDoctorSchema } from "../schemas/doctor.schema.js";

const router = Router();

router.get("/", auth, getDoctors);
router.get("/:id", auth, getDoctor);
router.post("/", auth, allowRoles("OWNER"),validate(createDoctorSchema), createDoctor);
router.put("/:id", auth, allowRoles("OWNER"), validate(updateDoctorSchema), updateDoctor);
router.delete("/:id", auth, allowRoles("OWNER"), deleteDoctor);

export default router;
