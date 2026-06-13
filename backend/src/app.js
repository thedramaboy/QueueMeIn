import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import branchRoutes from "./routes/branch.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import reportRoutes from "./routes/report.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import userRoutes from "./routes/user.routes.js";
import { startReminderJob } from "./jobs/reminder.job.js";
import { httpLogger } from "./middlewares/httpLogger.middleware.js";
import logger from "./utils/logger.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(httpLogger);

app.get("/", (req, res) => {
  res.json({ message: "Clinic Booking API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/webhook", webhookRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  logger.warn("Route not found", {
    method: req.method,
    url: req.url,
  });
  res.status(404).json({
    message: `Cannot ${req.method} ${req.url}`,
  });
});

app.use((err, req, res, next) => {
  logger.error("Unexpected error", {
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({
    message: " เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง",
  });
});

startReminderJob();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    port: PORT,
  });
});

export default app;
