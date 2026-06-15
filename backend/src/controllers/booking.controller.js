import prisma from "../utils/prisma.js";
import {
  generateBookingNo,
  calculateEndTime,
  isSlotAvailable,
} from "../utils/booking.helper.js";
import logger from "../utils/logger.js";

const VALID_TRANSITIONS = {
  PENDING:     ["CONFIRMED", "CANCELLED"],
  CONFIRMED:   ["COMPLETED", "CANCELLED", "NO_SHOW"],
  COMPLETED:   [],
  CANCELLED:   [],
  NO_SHOW:     [],
  RESCHEDULED: [],
};

export const getBookings = async (req, res) => {
  try {
    const { branchId, doctorId, date, startDate, endDate, status } = req.query;
    const effectiveBranchId = req.user.role === "STAFF" ? req.user.branchId : branchId;

    let dateFilter = {};
    if (date) {
      dateFilter = { date: { gte: new Date(`${date}T00:00:00.000Z`), lte: new Date(`${date}T23:59:59.999Z`) } };
    } else if (startDate && endDate) {
      dateFilter = { date: { gte: new Date(`${startDate}T00:00:00.000Z`), lte: new Date(`${endDate}T23:59:59.999Z`) } };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        ...dateFilter,
        ...(effectiveBranchId && { branchId: Number(effectiveBranchId) }),
        ...(doctorId && { doctorId: Number(doctorId) }),
        ...(status && { status }),
      },
      include: {
        patient: true,
        doctor: true,
        branch: true,
        service: true,
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
    });

    logger.info("Get bookings success", {
      count: bookings.length,
      date: date || null,
      branchId: branchId || null,
      requestedBy: req.user.id,
    });

    res.json(bookings);
  } catch (error) {
    logger.error("Get bookings error", {
      error: error.message,
      requestedBy: req.user.id,
    });
    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูลการจองทั้งหมดได้",
      error: error.message,
    });
  }
};

export const getBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: {
        patient: true,
        doctor: true,
        branch: true,
        service: true,
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        notifications: true,
        originalBooking: true,
      },
    });

    if (!booking) {
      logger.warn("Get booking failed - not found", { bookingId: id });
      return res.status(404).json({ message: "ไม่พบการจอง" });
    }

    logger.info("Get booking success", {
      bookingId: id,
      requestedBy: req.user.id,
    });
    res.json(booking);
  } catch (error) {
    logger.error("Get booking error", {
      bookingId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถดึงข้อมูลการจองได้", error: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      branchId,
      serviceId,
      date,
      startTime,
      deposit,
      note,
    } = req.body;

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) {
      logger.warn("Create booking failed - service not found", { serviceId });
      return res.status(404).json({ message: "ไม่พบบริการที่ต้องการเลือก" });
    }

    const endTime = calculateEndTime(startTime, service.duration);

    const available = await isSlotAvailable(prisma, {
      doctorId,
      branchId,
      date,
      startTime,
      endTime,
    });
    if (!available) {
      logger.warn("Create booking failed - slot not available", {
        doctorId,
        branchId,
        date,
        startTime,
      });
      return res.status(400).json({
        message: "เวลานี้มีการจองในระบบแล้ว กรุณาเลือกเวลาอื่น",
      });
    }

    const booking = await prisma.booking.create({
      data: {
        bookingNo: generateBookingNo(date),
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        branchId: Number(branchId),
        serviceId: Number(serviceId),
        date: new Date(date),
        startTime,
        endTime,
        deposit,
        note,
        createdBy: req.user.id,
        notifications: {
          create: [
            {
              type: "REMINDER_DAY_BEFORE",
              scheduledAt: new Date(
                new Date(date).setDate(new Date(date).getDate() - 1),
              ),
              message: `แจ้งเตือนนัดพรุ่งนี้เวลา ${startTime} น.`,
            },
            {
              type: "REMINDER_MORNING",
              scheduledAt: new Date(new Date(date).setHours(8, 0, 0)),
              message: `แจ้งเตือนนัดวันนี้ เวลา ${startTime} น.`,
            },
          ],
        },
      },
      include: {
        patient: true,
        doctor: true,
        branch: true,
        service: true,
      },
    });

    const bookingCount = await prisma.booking.count({
      where: { patientId: Number(patientId) },
    });
    if (bookingCount > 1) {
      await prisma.patient.update({
        where: { id: Number(patientId) },
        data: { isNewPatient: false },
      });
    }

    logger.info("Create booking success", {
      bookingId: booking.id,
      patientId,
      doctorId,
      branchId,
      date,
      startTime,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      message: "สร้างการจองสำเร็จ",
      booking,
    });
  } catch (error) {
    logger.error("Create booking error", {
      error: error.message,
      requestedBy: req.user.id,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถสร้างการจองได้", error: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.booking.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      logger.warn("Update booking status failed - not found", { bookingId: id });
      return res.status(404).json({ message: "ไม่พบการจองที่ต้องการอัปเดต" });
    }

    const allowed = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `ไม่สามารถเปลี่ยนสถานะจาก ${existing.status} เป็น ${status} ได้`,
      });
    }

    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        patient: true,
        doctor: true,
        branch: true,
        service: true,
      },
    });

    logger.info("Update booking status success", {
      bookingId: id,
      oldStatus: existing.status,
      newStatus: status,
      requestedBy: req.user.id,
    });
    res.json({
      message: "อัปเดตสถานะการจองสำเร็จ",
      booking,
    });
  } catch (error) {
    logger.error("Update booking status error", {
      bookingId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถอัปเดตการจองได้", error: error.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId, branchId, serviceId, date, startTime, deposit, note, treatmentNote } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ message: "ไม่พบการจอง" });
    }

    const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
    if (!service) {
      return res.status(404).json({ message: "ไม่พบบริการที่ต้องการเลือก" });
    }

    const endTime = calculateEndTime(startTime, service.duration);

    const available = await isSlotAvailable(prisma, {
      doctorId: Number(doctorId),
      branchId: Number(branchId),
      date,
      startTime,
      endTime,
      excludeBookingId: Number(id),
    });
    if (!available) {
      return res.status(400).json({ message: "เวลานี้มีการจองในระบบแล้ว กรุณาเลือกเวลาอื่น" });
    }

    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: {
        doctorId: Number(doctorId),
        branchId: Number(branchId),
        serviceId: Number(serviceId),
        date: new Date(date),
        startTime,
        endTime,
        deposit: deposit ?? null,
        note: note ?? null,
        treatmentNote: treatmentNote ?? null,
      },
      include: { patient: true, doctor: true, branch: true, service: true },
    });

    logger.info("Update booking success", { bookingId: id, requestedBy: req.user.id });
    res.json({ message: "อัปเดตการจองสำเร็จ", booking });
  } catch (error) {
    logger.error("Update booking error", { bookingId: req.params.id, error: error.message });
    res.status(500).json({ message: "ไม่สามารถอัปเดตการจองได้", error: error.message });
  }
};

export const markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, paymentMethod } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ message: "ไม่พบการจอง" });
    }

    const booking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { paidAmount, paymentMethod, paidAt: new Date() },
      include: { patient: true, doctor: true, branch: true, service: true },
    });

    logger.info("Mark as paid success", { bookingId: id, paidAmount, paymentMethod, requestedBy: req.user.id });
    res.json({ message: "บันทึกการชำระเงินสำเร็จ", booking });
  } catch (error) {
    logger.error("Mark as paid error", { bookingId: req.params.id, error: error.message });
    res.status(500).json({ message: "ไม่สามารถบันทึกการชำระเงินได้", error: error.message });
  }
};

export const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, note } = req.body;

    const existing = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: { service: true },
    });
    if (!existing) {
      logger.warn("Reschedule failed - booking not found", { bookingId: id });
      return res
        .status(404)
        .json({ message: "ไม่พบการจองที่ต้องการ Reschedule" });
    }

    const endTime = calculateEndTime(startTime, existing.service.duration);

    const available = await isSlotAvailable(prisma, {
      doctorId: existing.doctorId,
      branchId: existing.branchId,
      date,
      startTime,
      endTime,
      excludeBookingId: id,
    });
    if (!available) {
      logger.warn("Reschedule failed - slot not available", {
        bookingId: id,
        date,
        startTime,
      });
      return res.status(400).json({
        message: "ช่วงเวลานี้มีการจองแล้วในระบบ กรุณาเลือกเวลาอื่น",
      });
    }

    await prisma.booking.update({
      where: { id: Number(id) },
      data: { status: "RESCHEDULED" },
    });

    const newBooking = await prisma.booking.create({
      data: {
        bookingNo: generateBookingNo(date),
        patientId: existing.patientId,
        doctorId: existing.doctorId,
        branchId: existing.branchId,
        serviceId: existing.serviceId,
        date: new Date(date),
        startTime,
        endTime,
        deposit: existing.deposit,
        note: note || existing.note,
        createdBy: req.user.id,
        rescheduledFrom: existing.id,
        rescheduledAt: new Date(),
        notifications: {
          create: [
            {
              type: "REMINDER_DAY_BEFORE",
              scheduledAt: new Date(
                new Date(date).setDate(new Date(date).getDate() - 1),
              ),
              message: `แจ้งเตือนนัดพรุ่งนี้ เวลา ${startTime} น.`,
            },
            {
              type: "REMINDER_MORNING",
              scheduledAt: new Date(new Date(date).setHours(8, 0, 0)),
              message: `แจ้งเตือนนัดวันนี้ เวลา ${startTime} น.`,
            },
          ],
        },
      },
      include: {
        patient: true,
        doctor: true,
        branch: true,
        service: true,
      },
    });

    logger.info("Reschedule success", {
      oldBookingId: id,
      newBookingId: newBooking.id,
      newBookingNo: newBooking.bookingNo,
      date,
      startTime,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      message: "เลื่อนนัดสำเร็จ",
      booking: newBooking,
    });
  } catch (error) {
    logger.error("Reschedule error", {
      bookingId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถ Reschedule ได้", error: error.message });
  }
};
