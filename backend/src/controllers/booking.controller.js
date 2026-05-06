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
        staff: true,
      },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
    });

    res.json(bookings);
    
  } catch (error) {
    res
      .status(500)
      .json({
        message: "ไม่สามารถดึงข้อมูลการจองทั้งหมดได้",
        error: error.message,
      });
  }
};
