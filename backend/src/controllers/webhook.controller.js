import prisma from "../utils/prisma.js";
import axios from "axios";
import logger from "../utils/logger.js";

const getLineProfile = async (lineUserId) => {
  try {
    const res = await axios.get(
      `https://api.line.me/v2/bot/profile/${lineUserId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      },
    );
    return res.data;
  } catch {
    logger.warn("Get LINE profile failed", { lineUserId });
    return null;
  }
};

export const handleWebhook = async (req, res) => {
  res.sendStatus(200);

  const events = req.body.events;
  if (!events || events.length === 0) return;

  for (const event of events) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) continue;

    if (event.type === "follow") {
      const existingPatient = await prisma.patient.findFirst({
        where: { lineUserId },
      });
      if (existingPatient) {
        logger.info("LINE follow - already linked patient", {
          lineUserId,
          patientId: existingPatient.id,
        });
        continue;
      }

      const profile = await getLineProfile(lineUserId);

      await prisma.pendingLineUser.upsert({
        where: { lineUserId },
        update: {
          displayName: profile?.displayName,
          pictureUrl: profile?.pictureUrl,
        },
        create: {
          lineUserId,
          displayName: profile?.displayName,
          pictureUrl: profile?.pictureUrl,
        },
      });

      logger.info("LINE follow - saved pending user", {
        lineUserId,
        displayName: profile?.displayName,
      });
    }

    if (event.type === "unfollow") {
      await prisma.pendingLineUser.deleteMany({
        where: { lineUserId },
      });

      await prisma.patient.updateMany({
        where: { lineUserId },
        data: { lineUserId: null },
      });

      logger.info("LINE unfollow - cleared user", { lineUserId });
    }
  }
};

export const getPendingLineUsers = async (req, res) => {
  try {
    const pending = await prisma.pendingLineUser.findMany({
      orderBy: { createdAt: "desc" },
    });

    logger.info("Get pending LINE users success", {
      count: pending.length,
      requestedBy: req.user.id,
    });

    res.json(pending);
  } catch (error) {
    logger.error("Get pending LINE users error", { error: error.message });
    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูล LINE user ได้",
      error: error.message,
    });
  }
};

export const linkLineUser = async (req, res) => {
  try {
    const { patientId, lineUserId } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { id: Number(patientId) },
    });
    if (!patient) {
      logger.warn("Link LINE failed - patient not found", {
        patientId,
        lineUserId,
      });
      return res.status(404).json({ message: "ไม่พบข้อมูลลูกค้า" });
    }

    await prisma.patient.update({
      where: { id: Number(patientId) },
      data: { lineUserId },
    });

    await prisma.pendingLineUser.deleteMany({
      where: { lineUserId },
    });

    logger.info("Link LINE success", {
      patientId,
      lineUserId,
      requestedBy: req.user.id,
    });

    res.json({ message: "ผูก Line สำเร็จ" });
  } catch (error) {
    logger.error("Link LINE error", {
      patientId: req.body.patientId,
      lineUserId: req.body.lineUserId,
      error: error.message,
    });
    res.status(500).json({
      message: "ไม่สามารถเชื่อม LINE ID กับ User นี้ได้",
      error: error.message,
    });
  }
};
