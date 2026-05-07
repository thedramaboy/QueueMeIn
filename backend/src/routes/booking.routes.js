import { Router } from "express";
import {
  getBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  rescheduleBooking,
} from "../controllers/booking.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", auth, getBookings);
router.post("/", auth, allowRoles("OWNER", "STAFF"), createBooking);
router.patch(
  "/:id/status",
  auth,
  allowRoles("OWNER", "STAFF"),
  updateBookingStatus,
);
router.post(
  "/:id/reschedule",
  auth,
  allowRoles("OWNER", "STAFF"),
  rescheduleBooking,
);
router.get("/:id", auth, getBooking);

export default router;
