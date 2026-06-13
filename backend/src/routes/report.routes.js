import { Router } from "express";
import {
  getSummary,
  getBookingsReport,
  getPatientsReport,
} from "../controllers/report.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = Router();

router.get("/summary", auth, allowRoles("ADMIN"), getSummary);
router.get("/bookings", auth, allowRoles("ADMIN"), getBookingsReport);
router.get("/patients", auth, allowRoles("ADMIN"), getPatientsReport);

export default router
