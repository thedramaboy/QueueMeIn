import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

export const getDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      include: {
        doctorBranches: {
          include: { branch: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    logger.info("Get doctors success", {
      count: doctors.length,
      requestedBy: req.user.id,
    });

    res.json(doctors);
  } catch (error) {
    logger.error("Get doctors error", { error: error.message });
    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูลหมอทั้งหมดได้",
      error: error.message,
    });
  }
};

export const getDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { id: Number(id) },
      include: {
        doctorBranches: {
          include: { branch: true },
        },
        schedules: {
          where: { isActive: true },
        },
      },
    });
    if (!doctor) {
      logger.warn("Get doctor failed - not found", { doctorId: id });
      return res.status(404).json({ message: "ไม่พบข้อมูลหมอในระบบ" });
    }
    logger.info("Get doctor success", {
      doctorId: id,
      requestedBy: req.user.id,
    });
    res.json(doctor);
  } catch (error) {
    logger.error("Get doctor error", {
      doctorId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถดึงข้อมูลของหมอได้", error: error.message });
  }
};

export const createDoctor = async (req, res) => {
  try {
    const { name, specialty, phone, branchIds } = req.body;
    const doctor = await prisma.doctor.create({
      data: {
        name,
        specialty,
        phone,
        doctorBranches: {
          create: branchIds.map((branchId) => ({ branchId })),
        },
      },
      include: {
        doctorBranches: {
          include: { branch: true },
        },
      },
    });

    logger.info("Create doctor success", {
      doctorId: doctor.id,
      name: doctor.name,
      branchIds,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      message: "สร้างข้อมูลหมอสำเร็จ",
      doctor,
    });
  } catch (error) {
    logger.error("Create doctor error", {
      error: error.message,
      requestedBy: req.user.id,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถสร้างข้อมูลหมอได้", error: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, phone, branchIds } = req.body;

    const existing = await prisma.doctor.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      logger.warn("Update doctor failed - not found", { doctorId: id });
      return res.status(404).json({ message: "ไม่พบข้อมูลหมอ" });
    }

    await prisma.doctorBranch.deleteMany({
      where: { doctorId: Number(id) },
    });

    const doctor = await prisma.doctor.update({
      where: { id: Number(id) },
      data: {
        name,
        specialty,
        phone,
        doctorBranches: {
          create: branchIds.map((branchId) => ({ branchId })),
        },
      },
      include: {
        doctorBranches: {
          include: { branch: true },
        },
      },
    });

    logger.info("Update doctor success", {
      doctorId: id,
      branchIds,
      requestedBy: req.user.id,
    });

    res.json({
      message: "แก้ไข/ อัปเดตข้อมูลหมอสำเร็จ",
      doctor,
    });
  } catch (error) {
    logger.error("Update doctor error", {
      doctorId: req.params.id,
      error: error.message,
    });
    res.status(500).json({
      message: "ไม่สามารถแก้ไข/ อัปเดตข้อมูลหมอได้",
      error: error.message,
    });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.doctor.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      logger.warn("Delete doctor failed - not found", { doctorId: id });
      return res.status(404).json({ message: "ไม่พบข้อมูลหมอ" });
    }

    await prisma.doctor.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    logger.info("Delete doctor success", {
      doctorId: id,
      requestedBy: req.user.id,
    });

    res.json({ message: "ลบรายชื่อหมอออกจากระบบเรียบร้อย" });
  } catch (error) {
    logger.error("Delete doctor error", {
      doctorId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถลบหมอออกจากระบบได้", error: error.message });
  }
};
