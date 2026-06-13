import { Router } from "express";
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patient.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createPatientSchema, updatePatientSchema } from "../schemas/patient.schema.js"

const router = Router();

router.get("/", auth, getPatients);
router.get("/:id", auth, getPatient);
router.post("/", auth, allowRoles("SUPERUSER", "ADMIN", "STAFF"), validate(createPatientSchema), createPatient);
router.put("/:id", auth, allowRoles("SUPERUSER", "ADMIN", "STAFF"), validate(updatePatientSchema), updatePatient);
router.delete("/:id", auth, allowRoles("SUPERUSER", "ADMIN"), deletePatient);

export default router;
