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

const router = Router();

router.get("/", auth, getDoctors);
router.get("/:id", auth, getDoctor);
router.post("/", auth, allowRoles("OWNER"), createDoctor);
router.put("/:id", auth, allowRoles("OWNER"), updateDoctor);
router.delete("/:id", auth, allowRoles("OWNER"), deleteDoctor);

export default router;
