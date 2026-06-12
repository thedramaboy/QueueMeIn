import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

export const getSummary = async (req, res) => {
  try {
    const { month, year } = req.query;

    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const totalBookings = await prisma.booking.count({
      where: {
        date: { gte: startDate, lte: endDate },
        status: { notIn: ["CANCELLED"] },
      },
    });

    const newPatients = await prisma.patient.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        isNewPatient: true,
      },
    });

    const returningPatients = await prisma.booking.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: { notIn: ["CANCELLED"] },
      },
      select: { patientId: true },
      distinct: ["patientId"],
    });

    const bookingsByStatus = await prisma.booking.groupBy({
      by: ["status"],
      where: { date: { gte: startDate, lte: endDate } },
      _count: { status: true },
    });

    const bookingsByBranch = await prisma.booking.groupBy({
      by: ["branchId"],
      where: { date: { gte: startDate, lte: endDate } },
      _count: { branchId: true },
    });

    const branches = await prisma.branch.findMany();
    const branchMap = Object.fromEntries(
      branches.map((branch) => [branch.id, branch.name]),
    );

    const branchCountMap = {};
    for (const item of bookingsByBranch) {
      const name = branchMap[item.branchId] || "ไม่ทราบ";
      branchCountMap[name] = (branchCountMap[name] || 0) + item._count.branchId;
    }

    logger.info("Get summary success", {
      month: currentMonth,
      year: currentYear,
      totalBookings,
      newPatients,
      returningPatients: returningPatients.length,
      requestedBy: req.user.id,
    });

    res.json({
      month: currentMonth,
      year: currentYear,
      totalBookings,
      newPatients,
      returningPatients: returningPatients.length,
      bookingsByStatus: bookingsByStatus.map((booking) => ({
        status: booking.status,
        count: booking._count.status,
      })),
      bookingsByBranch: Object.entries(branchCountMap).map(([branch, count]) => ({
        branch,
        count,
      })),
    });
  } catch (error) {
    logger.error("Get summary error", {
      month: req.query.month,
      year: req.query.year,
      error: error.message,
    });
    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูลสรุปโดยรวมได้",
      error: error.message,
    });
  }
};

export const getBookingsReport = async (req, res) => {
  try {
    const { month, year, branchId } = req.query;

    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const bookings = await prisma.booking.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(branchId && { branchId: Number(branchId) }),
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            nickname: true,
            isNewPatient: true,
          },
        },
        doctor: { select: { name: true } },
        branch: { select: { name: true } },
        service: { select: { name: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    logger.info("Get bookings report success", {
      month: currentMonth,
      year: currentYear,
      count: bookings.length,
      branchId: branchId || null,
      requestedBy: req.user.id,
    });

    res.json(bookings);
  } catch (error) {
    logger.error("Get bookings report error", {
      month: req.query.month,
      year: req.query.year,
      error: error.message,
    });
    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูลสรุปการจองได้",
      error: error.message,
    });
  }
};

export const getPatientsReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
    const currentYear = year ? Number(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const newPatients = await prisma.patient.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      orderBy: { createdAt: "desc" },
    });

    const returningBookings = await prisma.booking.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        status: { notIn: ["CANCELLED"] },
        patient: { isNewPatient: false },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            nickname: true,
            phone: true,
          },
        },
      },
      distinct: ["patientId"],
    });

    logger.info("Get patients report success", {
      month: currentMonth,
      year: currentYear,
      newPatients: newPatients.length,
      returningPatients: returningBookings.length,
      requestedBy: req.user.id,
    });

    res.json({
      newPatients,
      returningPatients: returningBookings.map((booking) => booking.patient),
    });
  } catch (error) {
    logger.error("Get patients report error", {
      month: req.query.month,
      year: req.query.year,
      error: error.message,
    });
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};
