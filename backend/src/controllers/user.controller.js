import bcrypt from "bcrypt";
import prisma from "../utils/prisma.js";
import logger from "../utils/logger.js";

const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    branchId: true,
    isActive: true,
    createdAt: true,
    branch: { select: { id: true, name: true } },
};

export const getUsers = async (req, res) => {
    try {
        const where = req.user.role === "ADMIN" ? { role: "STAFF" } : {};
        const users = await prisma.user.findMany({
            where,
            select: userSelect,
            orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
        });
        logger.info("Get users success", { count: users.length, requestedBy: req.user.id });
        res.json(users);
    } catch (error) {
        logger.error("Get users error", { error: error.message });
        res.status(500).json({ message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(req.params.id) },
            select: userSelect,
        });
        if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        res.json(user);
    } catch (error) {
        logger.error("Get user error", { error: error.message, userId: req.params.id });
        res.status(500).json({ message: "ไม่สามารถดึงข้อมูลผู้ใช้ได้" });
    }
};

export const createUser = async (req, res) => {
    try {
        const { name, email, password, role, branchId } = req.body;

        if (req.user.role === "ADMIN" && role !== "STAFF") {
            return res.status(403).json({ message: "Admin สามารถสร้างได้เฉพาะบัญชี Staff เท่านั้น" });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            if (!existing.isActive) {
                const hashed = await bcrypt.hash(password, 10);
                const user = await prisma.user.update({
                    where: { email },
                    data: { name, password: hashed, role, branchId: branchId ?? null, isActive: true },
                    select: userSelect,
                });
                logger.info("Reactivate user success", { userId: user.id, requestedBy: req.user.id });
                return res.status(201).json({ message: "เปิดใช้งานบัญชีเดิมสำเร็จ", user });
            }
            return res.status(409).json({ message: "Email นี้มีในระบบแล้ว" });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashed, role, branchId: branchId ?? null },
            select: userSelect,
        });

        logger.info("Create user success", { userId: user.id, requestedBy: req.user.id });
        res.status(201).json({ message: "สร้างบัญชีผู้ใช้สำเร็จ", user });
    } catch (error) {
        logger.error("Create user error", { error: error.message, requestedBy: req.user.id });
        res.status(500).json({ message: "ไม่สามารถสร้างผู้ใช้ได้" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.user.findUnique({ where: { id: Number(id) } });
        if (!existing) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

        const user = await prisma.user.update({
            where: { id: Number(id) },
            data: req.body,
            select: userSelect,
        });

        logger.info("Update user success", { userId: id, requestedBy: req.user.id });
        res.json({ message: "อัปเดตผู้ใช้สำเร็จ", user });
    } catch (error) {
        logger.error("Update user error", { error: error.message, userId: req.params.id });
        res.status(500).json({ message: "ไม่สามารถอัปเดตผู้ใช้ได้" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (Number(id) === req.user.id) {
            return res.status(400).json({ message: "ไม่สามารถปิดใช้งานบัญชีตัวเองได้" });
        }

        const existing = await prisma.user.findUnique({ where: { id: Number(id) } });
        if (!existing) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        if (!existing.isActive) return res.status(400).json({ message: "บัญชีนี้ถูกปิดใช้งานแล้ว" });
        if (req.user.role === "ADMIN" && existing.role !== "STAFF") {
            return res.status(403).json({ message: "Admin สามารถจัดการได้เฉพาะบัญชี Staff เท่านั้น" });
        }

        await prisma.user.update({
            where: { id: Number(id) },
            data: { isActive: false },
        });

        logger.info("Deactivate user success", { userId: id, requestedBy: req.user.id });
        res.json({ message: "ปิดใช้งานบัญชีสำเร็จ" });
    } catch (error) {
        logger.error("Deactivate user error", { error: error.message, userId: req.params.id });
        res.status(500).json({ message: "ไม่สามารถปิดใช้งานบัญชีได้" });
    }
};
