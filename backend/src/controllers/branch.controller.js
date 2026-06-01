import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

export const getBranches = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    logger.info("Get branches success", {
      count: branches.length,
      requestedBy: req.user.id,
    });
    res.json(branches);
  } catch (error) {
    logger.error("Get branches error", { error: error.message });
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลสาขาทั้งหมดได้" });
  }
};

export const getBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id: Number(id) },
      include: {
        doctorBranches: {
          include: { doctor: true },
        },
        schedules: {
          where: { isActive: true },
        },
      },
    });

    if (!branch) {
      logger.warn("Get branch failed - not found", { branchId: id });
      return res.status(404).json({ message: "ไม่พบข้อมูลสาขา" });
    }

    logger.info("Get branch success", {
      branchId: id,
      requestedBy: req.user.id,
    });
    res.json(branch);
  } catch (error) {
    logger.error("Get branch error", {
      branchId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถดึงข้อมูลสาขาได้", error: error.message });
  }
};

export const createBranch = async (req, res) => {
  try {
    const { name, location, phone } = req.body;

    const branch = await prisma.branch.create({
      data: { name, location, phone },
    });

    logger.info("Create branch success", {
      branchId: branch.id,
      name: branch.name,
      requestedBy: req.user.id,
    });
    res.status(201).json({
      message: "สร้างสาขาสำเร็จ",
      branch,
    });
  } catch (error) {
    logger.error("Create branch error", {
      error: error.message,
      requestedBy: req.user.id,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถสร้างสาขาใหม่ได้", error: error.message });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, phone, isActive } = req.body;

    const existing = await prisma.branch.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      logger.warn("Update branch failed - not found", { branchId: id });
      return res
        .status(404)
        .json({ message: "ไม่พบข้อมูลสาขาที่ต้องการอัปเดต" });
    }

    const branch = await prisma.branch.update({
      where: { id: Number(id) },
      data: { name, location, phone, isActive },
    });

    logger.info("Update branch success", {
      branchId: id,
      requestedBy: req.user.id,
    });

    res.json({ message: "แก้ไขข้อมูลสาขาสำเร็จ", branch });
  } catch (error) {
    logger.error("Update branch error", {
      branchId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถอัปเดตสาขาได้", error: error.message });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.branch.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      logger.warn("Delete branch failed - not found", { branchId: id });
      return res.status(404).json({ message: "ไม่พบข้อมูลสาขาที่ต้องการลบ" });
    }

    const branch = await prisma.branch.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    logger.info("Delete branch success", {
      branchId: id,
      requestedBy: req.user.id,
    });

    res.json({
      message: "ลบสาขาสำเร็จ",
      branch,
    });
  } catch (error) {
    logger.error("Delete branch error", {
      branchId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถลบสาขาได้", error: error.message });
  }
};
