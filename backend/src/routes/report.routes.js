import { Router } from "express";
import {
  getSummary,
  getBookingsReport,
  getPatientsReport,
} from "../controllers/report.controller";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = Router();

router.get("/summary", auth, allowRoles("OWNER"), getSummary);
router.get("/bookings", auth, allowRoles("OWNER"), getBookingsReport);
router.get("/patients", auth, allowRoles("OWNER"), getPatientsReport);

export default router
