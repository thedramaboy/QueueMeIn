import prisma from "../utils/prisma.js";

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
      bookingsByBranch: bookingsByBranch.map((booking) => ({
        branch: branchMap[booking.branchId] || "ไม่ทราบ",
        count: booking._count.branchId,
      })),
    });
  } catch (error) {
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

    res.json(bookings);
  } catch (error) {
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

    res.json({
      newPatients,
      returningPatients: returningBookings.map((booking) => booking.patient),
    });
  } catch (error) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: error.message });
  }
};
