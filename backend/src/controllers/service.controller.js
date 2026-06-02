import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

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

    logger.info("Get services success", {
      count: services.length,
      categoryId: categoryId || null,
      requestedBy: req.user.id,
    });

    res.json(services);
  } catch (error) {
    logger.error("Get services error", { error: error.message });
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
      logger.warn("Get service failed - not found", { serviceId: id });
      return res.status(404).json({ message: "ไม่พบข้อมูลการบริการ" });
    }

    logger.info("Get service success", {
      serviceId: id,
      requestedBy: req.user.id,
    });
    res.json(service);
  } catch (error) {
    logger.error("Get service error", {
      serviceId: req.params.id,
      error: error.message,
    });
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
      logger.warn("Create service failed - category not found", { categoryId });
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

    logger.info("Create service success", {
      serviceId: service.id,
      name: service.name,
      categoryId,
      duration,
      requestedBy: req.user.id,
    });

    res.status(201).json({
      message: "สร้างการบริการเรียบร้อยแล้ว",
      service,
    });
  } catch (error) {
    logger.error("Create service error", {
      error: error.message,
      requestedBy: req.user.id,
    });
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
      logger.warn("Update service failed - not found", { serviceId: id });
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

    logger.info("Update service success", {
      serviceId: id,
      name,
      requestedBy: req.user.id,
    });

    res.json({
      message: "แก้ไขการบริการสำเร็จ",
      service,
    });
  } catch (error) {
    logger.error("Update service error", {
      serviceId: req.params.id,
      error: error.message,
    });
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
      logger.warn("Delete service failed - not found", { serviceId: id });
      return res.status(404).json({ message: "ไม่พบการบริการที่ต้องการลบ" });
    }

    await prisma.service.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    logger.info("Delete service success", {
      serviceId: id,
      requestedBy: req.user.id,
    });

    res.json({ message: "ลบบริการนี้เรียบร้อยแล้ว" });
  } catch (error) {
    logger.error("Delete service error", {
      serviceId: req.params.id,
      error: error.message,
    });
    res
      .status(500)
      .json({ message: "ไม่สามารถลบบริการนี้ได้", error: error.message });
  }
};
