import prisma from "../utils/prisma.js";

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

    res.json(doctors);
  } catch (error) {
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
      return res.status(404).json({ message: "ไม่พบข้อมูลหมอในระบบ" });
    }
    res.json(doctor);
  } catch (error) {
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

    res.status(201).json({
      message: "สร้างข้อมูลหมอสำเร็จ",
      doctor,
    });
  } catch (error) {
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

    res.json({
      message: "แก้ไข/ อัปเดตข้อมูลหมอสำเร็จ",
      doctor,
    });
  } catch (error) {
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
      return res.status(404).json({ message: "ไม่พบข้อมูลหมอ" });
    }

    await prisma.doctor.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({ message: "ลบรายชื่อหมอออกจากระบบเรียบร้อย" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "ไม่สามารถลบหมอออกจากระบบได้", error: error.message });
  }
};
