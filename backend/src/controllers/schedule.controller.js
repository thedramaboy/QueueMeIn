import prisma from "../utils/prisma.js";

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

    res.json(schedules);
  } catch (error) {
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
      return res
        .status(404)
        .json({ message: "ไม่พบตารางเวลาที่ต้องการ", error: error.message });
    }

    res.json(schedule);
  } catch (error) {
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

    res.status(201).json({
      message: "สร้างตารางเวลาเรียบร้อยแล้ว",
      schedule,
    });
  } catch (error) {
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

    res.json({
      message: "แก้ไขตารางเวลาเรียบร้อยแล้ว",
      schedule,
    });
  } catch (error) {
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
      return res.status(404).json({ meesage: "ไม่พบตารางเวลาที่ต้องการลบ" });
    }

    await prisma.schedule.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({ message: "ลบตารางเวลาเรียบร้อยแล้ว" });
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถลบตารางเวลาได้",
      error: error.message,
    });
  }
};
