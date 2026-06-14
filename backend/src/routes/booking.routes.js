import { Router } from "express";
import {
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  updateBookingStatus,
  markAsPaid,
  rescheduleBooking,
} from "../controllers/booking.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createBookingSchema, updateBookingSchema, updateBookingStatusSchema, markAsPaidSchema, rescheduleBookingSchema } from "../schemas/booking.schema.js";

const router = Router();

router.get("/", auth, getBookings);
router.post("/", auth, allowRoles("SUPERUSER", "ADMIN", "STAFF"), validate(createBookingSchema), createBooking);
router.patch(
  "/:id/status",
  auth,
  allowRoles("SUPERUSER", "ADMIN", "STAFF"),
  validate(updateBookingStatusSchema),
  updateBookingStatus,
);
router.patch(
  "/:id",
  auth,
  allowRoles("SUPERUSER", "ADMIN", "STAFF"),
  validate(updateBookingSchema),
  updateBooking,
);
router.patch(
  "/:id/payment",
  auth,
  allowRoles("SUPERUSER", "ADMIN", "STAFF"),
  validate(markAsPaidSchema),
  markAsPaid,
);
router.post(
  "/:id/reschedule",
  auth,
  allowRoles("SUPERUSER", "ADMIN", "STAFF"),
  validate(rescheduleBookingSchema),
  rescheduleBooking,
);
router.get("/:id", auth, getBooking);

export default router;
