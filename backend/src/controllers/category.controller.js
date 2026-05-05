import prisma from "../utils/prisma.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        services: {
          where: { isActive: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูลประเภทการบริการได้",
      error: error.message,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await prisma.category.findUnique({
      where: { name },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "ชื่อ Category นี้มีอยู่ในระบบแล้ว" });
    }

    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json({
      message: "สร้าง Category เรียบร้อยแล้ว",
    });
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถสร้างประเภทการบริการได้",
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ message: "ไม่พบประเภทการบริการนี้ในระบบ" });
    }

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name },
    });

    res.json({
      message: "แก้ไขประเภทการบริการสำเร็จ",
      category,
    });
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถแก้ไขประเภทการบริการนี้ได้",
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!existing) {
      return res.status(404).json({ message: "ไม่พบ Category นี้ในระบบ" });
    }

    await prisma.category.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({ message: "ลบ Category เรียบร้อยแล้ว" });
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถลบ Category นี้ได้",
      error: message.error,
    });
  }
};
