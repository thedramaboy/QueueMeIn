import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

export const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const branchFilter = req.user.role === "STAFF" && req.user.branchId
      ? { branchId: req.user.branchId }
      : {};

    const [todayBookings, totalPatients, newPatientsThisMonth, revenueAgg, statusBreakdown] =
      await Promise.all([
        prisma.booking.findMany({
          where: { date: { gte: todayStart, lte: todayEnd }, ...branchFilter },
          include: { patient: true, doctor: true, branch: true, service: true },
          orderBy: { startTime: "asc" },
        }),
        prisma.patient.count(),
        prisma.patient.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
        prisma.booking.aggregate({
          where: { paidAt: { gte: monthStart, lte: monthEnd }, ...branchFilter },
          _sum: { paidAmount: true },
        }),
        prisma.booking.groupBy({
          by: ["status"],
          where: { date: { gte: monthStart, lte: monthEnd }, ...branchFilter },
          _count: { status: true },
        }),
      ]);

    // 12-month volume — fetch all in one query then group in JS
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const recentBookings = await prisma.booking.findMany({
      where: {
        date: { gte: twelveMonthsAgo },
        status: { notIn: ["CANCELLED"] },
        ...branchFilter,
      },
      select: { date: true },
    });

    const volumeMap = {};
    for (const b of recentBookings) {
      const key = `${b.date.getFullYear()}-${b.date.getMonth()}`;
      volumeMap[key] = (volumeMap[key] || 0) + 1;
    }

    const monthlyVolume = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyVolume.push({
        label: d.toLocaleDateString("th-TH-u-ca-buddhist", { month: "short", year: "2-digit" }),
        count: volumeMap[key] || 0,
      });
    }

    logger.info("Get dashboard success", { requestedBy: req.user.id });

    res.json({
      todayBookings,
      todayCount: todayBookings.length,
      pendingCount: todayBookings.filter((b) => b.status === "PENDING").length,
      totalPatients,
      newPatientsThisMonth,
      monthRevenue: Number(revenueAgg._sum.paidAmount ?? 0),
      monthlyVolume,
      statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count.status })),
    });
  } catch (error) {
    logger.error("Get dashboard error", { error: error.message });
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลแดชบอร์ดได้", error: error.message });
  }
};

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
