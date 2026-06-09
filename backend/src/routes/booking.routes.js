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
import { validate } from "../middlewares/validate.middleware.js";
import { createBookingSchema, updateBookingStatusSchema, rescheduleBookingSchema } from "../schemas/booking.schema.js";

const router = Router();

router.get("/", auth, getBookings);
router.post("/", auth, allowRoles("OWNER", "STAFF"),validate(createBookingSchema), createBooking);
router.patch(
  "/:id/status",
  auth,
  allowRoles("OWNER", "STAFF"),
  validate(updateBookingStatusSchema),
  updateBookingStatus,
);
router.post(
  "/:id/reschedule",
  auth,
  allowRoles("OWNER", "STAFF"),
  validate(rescheduleBookingSchema),
  rescheduleBooking,
);
router.get("/:id", auth, getBooking);

export default router;
