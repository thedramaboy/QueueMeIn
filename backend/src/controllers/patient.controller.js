import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

export const getPatients = async (req, res) => {
  try {
    const { search, isNewPatient } = req.query;

    const patients = await prisma.patient.findMany({
      where: {
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { nickname: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { opdNumber: { contains: search } },
          ],
        }),
        ...(isNewPatient !== undefined && {
          isNewPatient: isNewPatient === "true",
        }),
      },
      orderBy: { createdAt: "desc" },
    });

    logger.info("Get patients success", {
      count: patients.length,
      requestedBy: req.user.id,
    });

    res.json(patients);
  } catch (error) {
    logger.error("Get patients error", {
      error: error.message,
      requestedBy: req.user.id,
    });
    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูลลูกค้าทั้งหมดได้",
      error: error.message,
    });
  }
};

export const getPatient = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: Number(id) },
      include: {
        bookings: {
          include: {
            service: true,
            doctor: true,
            branch: true,
          },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!patient) {
      logger.warn("Get specific patient failed - not found", {
        patientId: id,
      });
      return res.status(404).json({ message: "ไม่พบข้อมูลลูกค้า" });
    }

    logger.info("Get patient success", {
      patientId: id,
      requestedBy: req.user.id,
    });
    res.json(patient);
  } catch (error) {
    logger.error("Get patient error", {
      patientId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถค้นหาลูกค้ารายนี้ได้", error: error.message });
  }
};

export const createPatient = async (req, res) => {
  try {
    const {
      opdNumber,
      nationalId,
      firstName,
      lastName,
      nickname,
      phone,
      age,
      allergyHistory,
      lineUserId,
    } = req.body;

    const existingPhone = await prisma.patient.findUnique({
      where: { phone },
    });
    if (existingPhone) {
      logger.warn("Create patient failed - phone exists", { phone });
      return res.status(400).json({ message: "เบอร์โทรนี้มีในระบบแล้ว" });
    }

    const existingOpd = await prisma.patient.findUnique({
      where: { opdNumber },
    });
    if (existingOpd) {
      logger.warn("Create patient failed - OPD exists", { opdNumber });
      return res.status(400).json({ message: "เลข OPD นี้มีในระบบแล้ว" });
    }

    const patient = await prisma.patient.create({
      data: {
        opdNumber,
        nationalId,
        firstName,
        lastName,
        nickname,
        phone,
        age,
        allergyHistory,
        lineUserId,
      },
    });

    logger.info("Create patient success", {
      patientId: patient.id,
      opdNumber: patient.opdNumber,
      nickname: patient.nickname,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      message: "สร้างข้อมูลลูกค้าสำเร็จ",
      patient,
    });
  } catch (error) {
    logger.error("Create patient error", { error: error.message });
    res
      .status(500)
      .json({ message: "ไม่สามารถสร้างข้อมูลลูกค้าได้", error: error.message });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      firstName,
      lastName,
      nickname,
      phone,
      age,
      allergyHistory,
      lineUserId,
    } = req.body;

    const existing = await prisma.patient.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      logger.warn("Update patient failed - notfound", { patientId: id });
      return res
        .status(404)
        .json({ message: "ไม่พบข้อมูลลูกค้าที่ต้องการแก้ไข" });
    }

    const patient = await prisma.patient.update({
      where: { id: Number(id) },
      data: {
        firstName,
        lastName,
        nickname,
        phone,
        age,
        allergyHistory,
        lineUserId,
      },
    });

    logger.info("Update patient success", {
      patientId: id,
      requestedBy: req.user.id,
    });

    res.json({
      message: "แก้ไขข้อมูลลูกค้าสำเร็จ",
      patient,
    });
  } catch (error) {
    logger.error("Update patient error", {
      patientId: req.params.id,
      error: error.message,
    });
    res.status(500).json({
      message: "ไม่สามารถอัปเดตข้อมูลลูกค้าได้",
      error: error.message,
    });
  }
};

export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.patient.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      logger.warn("Delete patient failed - not found", { patientId: id });
      return res.status(404).json({ message: "ไม่พบข้อมูลลูกค้าที่ต้องการลบ" });
    }

    await prisma.patient.delete({
      where: { id: Number(id) },
    });

    logger.info("Delete patient success", {
      patientId: id,
      requestedBy: req.user.id,
    });
    res.json({ message: "ลบข้อมูลลูกค้าเรียบร้อยแล้ว" });
  } catch (error) {
    logger.error("Delete patient error", {
      patientId: req.params.id,
      error: error.message,
    });
    res.status(500).json({
      message: "ไม่สามารถลบข้อมูลลูกค้าได้",
      error: error.message,
    });
  }
};
