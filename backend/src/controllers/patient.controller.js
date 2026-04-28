import prisma from "../utils/prisma.js";

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

    res.json(patients);
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถค้นหาลูกค้าทั้งหมดได้",
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
      return res.status(404).json({ message: "ไม่พบข้อมูลลูกค้า" });
    }

    res.json(patient);
  } catch (error) {
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
      return res.status(400).json({ message: "เบอร์โทรนี้มีในระบบแล้ว" });
    }

    const existingOpd = await prisma.patient.findUnique({
      where: { opdNumber },
    });
    if (existingOpd) {
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

    res.status(201).json({
      message: "สร้างข้อมูลลูกค้าเรียบร้อย",
      patient,
    });
  } catch (error) {
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

    res.json({
      message: "แก้ไขข้อมูลลูกค้าสำเร็จ",
      patient,
    });
  } catch (error) {
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
      return res.status(404).json({ message: "ไม่พบข้อมูลลูกค้าที่ต้องการลบ" });
    }

    await prisma.patient.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "ลบข้อมูลลูกค้าเรียบร้อยแล้ว" });
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถลบข้อมูลลูกค้าได้",
      error: error.message,
    });
  }
};
