import prisma from "../utils/prisma.js";
import {
  generateBookingNo,
  calculateEndTime,
  isSlotAvailable,
} from "../utils/booking.helper.js";

export const getBookings = async (req, res) => {
  try {
    const { branchId, doctorId, date, status } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        ...(branchId && { brancId: Number(branchId) }),
        ...(doctorId && { doctorId: Number(doctorId) }),
        ...(status && { status }),
        ...(date && {
          date: new Date(date),
        }),
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

    res.json(bookings);
  } catch (error) {
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
      return res.status(404).json({ message: "ไม่พบการจอง" });
    }

    res.json(booking);
  } catch (error) {
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

    res.status(201).json({
      message: "สร้างการจองสำเร็จ",
      booking,
    });
  } catch (error) {
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
      return res.status(404).json({ message: "ไม่พบการจองที่ต้องการอัปเดต" });
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

    res.json({
      message: "อัปเดตสถานะการจองสำเร็จ",
      booking,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "ไม่สามารถอัปเดตการจองได้", error: error.message });
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

    res.status(201).json({
      message: "เลื่อนนัดสำเร็จ",
      booking: newBooking,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "ไม่สามารถ Reschedule ได้", error: error.message });
  }
};
