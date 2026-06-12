import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

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

    logger.info("Get categories success", {
      count: categories.length,
      requestedBy: req.user.id,
    });

    res.json(categories);
  } catch (error) {
    logger.error("Get categories error", { error: error.message });
    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูลประเภทการบริการได้",
      error: error.message,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await prisma.category.findUnique({ where: { name } });

    if (existing) {
      if (existing.isActive) {
        logger.warn("Create category failed - already exists", { name });
        return res.status(400).json({ message: "ชื่อ Category นี้มีอยู่ในระบบแล้ว" });
      }
      const category = await prisma.category.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
      logger.info("Reactivated category", { categoryId: category.id, name, requestedBy: req.user.id });
      return res.status(201).json({ message: "สร้าง Category เรียบร้อยแล้ว", category });
    }

    const category = await prisma.category.create({ data: { name } });

    logger.info("Create category success", {
      categoryId: category.id,
      name: category.name,
      requestedBy: req.user.id,
    });
    res.status(201).json({ message: "สร้าง Category เรียบร้อยแล้ว", category });
  } catch (error) {
    logger.error("Create category error", {
      error: error.message,
      requestedBy: req.user.id,
    });
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
      logger.warn("Update category failed - not found", { categoryId: id });
      return res.status(404).json({ message: "ไม่พบประเภทการบริการนี้ในระบบ" });
    }

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: { name },
    });

    logger.info("Update category success", {
      categoryId: id,
      name,
      requestedBy: req.user.id,
    });

    res.json({
      message: "แก้ไขประเภทการบริการสำเร็จ",
      category,
    });
  } catch (error) {
    logger.error("Update category error", {
      categoryId: req.params.id,
      error: error.message,
    });
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
      logger.warn("Delete category failed - not found", { categoryId: id });
      return res.status(404).json({ message: "ไม่พบ Category นี้ในระบบ" });
    }

    await prisma.category.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    logger.info("Delete category success", {
      categoryId: id,
      requestedBy: req.user.id,
    });

    res.json({ message: "ลบ Category เรียบร้อยแล้ว" });
  } catch (error) {
    logger.error("Delete category error", {
      categoryId: req.params.id,
      error: error.message,
    });
    res.status(500).json({
      message: "ไม่สามารถลบ Category นี้ได้",
      error: error.message,
    });
  }
};
