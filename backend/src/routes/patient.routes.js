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

const router = Router();

router.get("/", auth, getPatients);
router.get("/:id", auth, getPatient);
router.post("/", auth, allowRoles("OWNER", "STAFF"), createPatient);
router.put("/:id", auth, allowRoles("OWNER", "STAFF"), updatePatient);
router.delete("/:id", auth, allowRoles("OWNER"), deletePatient);

export default router;
