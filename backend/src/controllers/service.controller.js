import prisma from "../utils/prisma.js";

export const getServices = async (req, res) => {
  try {
    const { categoryId } = req.query;

    const services = await prisma.service.findMany({
      where: {
        isActive: true,
        ...(categoryId && { categoryId: Number(categoryId) }),
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(services);
  } catch (error) {
    res
      .status(500)
      .json({ message: "ไม่สามารถดึงข้อมูลบริการได้", error: error.message });
  }
};

export const getService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });

    if (!service) {
      return res.status(404).json({ message: "ไม่พบข้อมูลการบริการ" });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูลการบริการได้",
      error: error.message,
    });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, categoryId, duration, price, description } = req.body;

    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
    });

    if (!category) {
      return res.status(404).json({ message: "ไม่พบประเภทที่จะเพิ่มบริการ" });
    }

    const service = await prisma.service.create({
      data: {
        name,
        categoryId: Number(categoryId),
        duration: Number(duration),
        price,
        description,
      },
      include: { category: true },
    });

    res.status(201).json({
      message: "สร้างการบริการเรียบร้อยแล้ว",
      service,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "ไม่สามารถสร้างบริการได้", error: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, duration, price, description } = req.body;

    const existing = await prisma.service.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ message: "ไม่พบการบริการที่ต้องการอัปเดต" });
    }

    const service = await prisma.service.update({
      where: { id: Number(id) },
      data: {
        name,
        categoryId: Number(categoryId),
        duration: Number(duration),
        price,
        description,
      },
      include: { category: true },
    });

    res.json({
      message: "แก้ไขการบริการสำเร็จ",
      service,
    });
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถอัปเดตการบริการนี้ได้",
      error: error.message,
    });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.service.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ message: "ไม่พบการบริการที่ต้องการลบ" });
    }

    await prisma.service.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({ message: "ลบบริการนี้เรียบร้อยแล้ว" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "ไม่สามารถลบบริการนี้ได้", error: error.message });
  }
};
