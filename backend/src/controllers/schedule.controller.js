import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

export const getSchedules = async (req, res) => {
  try {
    const { branchId, doctorId, dayOfWeek } = req.query;

    const schedules = await prisma.schedule.findMany({
      where: {
        isActive: true,
        ...(branchId && { branchId: Number(branchId) }),
        ...(doctorId && { doctorId: Number(doctorId) }),
        ...(dayOfWeek && { dayOfWeek: Number(dayOfWeek) }),
      },
      include: {
        branch: true,
        doctor: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    logger.info("Get schedules success", {
      count: schedules.length,
      branchId: branchId || null,
      doctorId: doctorId || null,
      dayOfWeek: dayOfWeek || null,
      requestedBy: req.user.id,
    });
    res.json(schedules);
  } catch (error) {
    llogger.error("Get schedules error", { error: error.message });
    res
      .status(500)
      .json({ message: "ไม่สามารถดึงตารางทั้งหมดได้", error: error.message });
  }
};

export const getSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.schedule.findUnique({
      where: { id: Number(id) },
      include: {
        branch: true,
        doctor: true,
      },
    });

    if (!schedule) {
      logger.warn("Get schedule failed - not found", { scheduleId: id });
      return res.status(404).json({ message: "ไม่พบตารางเวลาที่ต้องการ" });
    }

    logger.info("Get schedule success", {
      scheduleId: id,
      requestedBy: req.user.id,
    });
    res.json(schedule);
  } catch (error) {
    logger.error("Get schedule error", {
      scheduleId: req.params.id,
      error: error.message,
    });
    res.status(500).json({
      message: "ไม่สามารถดึงตารางเวลาที่ต้องการได้, error: error.message",
    });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { branchId, doctorId, dayOfWeek, startTime, endTime } = req.body;

    const doctorBranch = await prisma.doctorBranch.findUnique({
      where: {
        doctorId_branchId: {
          doctorId: Number(doctorId),
          branchId: Number(branchId),
        },
      },
    });
    if (!doctorBranch) {
      logger.warn("Create schedule failed - doctor not in branch", {
        doctorId,
        branchId,
      });
      return res.status(400).json({
        message: "ไม่มีตารางเวลาของหมอที่เลือก",
      });
    }

    const existing = await prisma.schedule.findUnique({
      where: {
        branchId_doctorId_dayOfWeek: {
          branchId: Number(branchId),
          doctorId: Number(doctorId),
          dayOfWeek: Number(dayOfWeek),
        },
      },
    });
    if (existing) {
      logger.warn("Create schedule failed - already exists", {
        doctorId,
        branchId,
        dayOfWeek,
      });
      return res.status(400).json({
        message: "มีตารางเวลานี้อยู่ในระบบแล้ว",
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        branchId: Number(branchId),
        doctorId: Number(doctorId),
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
      },
      include: {
        branch: true,
        doctor: true,
      },
    });

    logger.info("Create schedule success", {
      scheduleId: schedule.id,
      doctorId,
      branchId,
      dayOfWeek,
      startTime,
      endTime,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      message: "สร้างตารางเวลาเรียบร้อยแล้ว",
      schedule,
    });
  } catch (error) {
    logger.error("Create schedule error", {
      error: error.message,
      requestedBy: req.user.id,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถสร้างตารางเวลาได้", error: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, isActive } = req.body;

    const existing = await prisma.schedule.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      logger.warn("Update schedule failed - not found", { scheduleId: id });
      return res.status(404).json({ message: "ไม่พบตารางเวลาที่ต้องการแก้ไข" });
    }

    const schedule = await prisma.schedule.update({
      where: { id: Number(id) },
      data: { startTime, endTime, isActive },
      include: {
        branch: true,
        doctor: true,
      },
    });

    logger.info("Update schedule success", {
      scheduleId: id,
      requestedBy: req.user.id,
    });

    res.json({
      message: "แก้ไขตารางเวลาเรียบร้อยแล้ว",
      schedule,
    });
  } catch (error) {
    logger.error("Update schedule error", {
      scheduleId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถแก้ไขตารางเวลาได้", error: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.schedule.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      logger.warn("Delete schedule failed - not found", { scheduleId: id });
      return res.status(404).json({ message: "ไม่พบตารางเวลาที่ต้องการลบ" });
    }

    await prisma.schedule.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    logger.info("Delete schedule success", {
      scheduleId: id,
      requestedBy: req.user.id,
    });

    res.json({ message: "ลบตารางเวลาเรียบร้อยแล้ว" });
  } catch (error) {
    logger.error("Delete schedule error", {
      scheduleId: req.params.id,
      error: error.message,
    });
    res.status(500).json({
      message: "ไม่สามารถลบตารางเวลาได้",
      error: error.message,
    });
  }
};
