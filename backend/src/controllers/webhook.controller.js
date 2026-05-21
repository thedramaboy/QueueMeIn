import prisma from "../utils/prisma.js";
import axios from "axios";

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
      console.log("New follower:", lineUserId);

      const existingPatient = await prisma.patient.findFirst({
        where: { lineUserId },
      });
      if (existingPatient) continue;

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

      console.log("Saved pending LINE user:", lineUserId);
    }

    if (event.type === "unfollow") {
      await prisma.pendingLineUser.deleteMany({
        where: { lineUserId },
      });

      await prisma.patient.updateMany({
        where: { lineUserId },
        data: { lineUserId: null },
      });
    }

    // if (event.type === "message") {
    //   console.log("Message from:", lineUserId, event.message?.text);
    // }
  }
};

export const getPendingLineUsers = async (req, res) => {
  try {
    const pending = await prisma.pendingLineUser.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(pending);
  } catch (error) {
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
      return res.status(404).json({ message: "ไม่พบข้อมูลลูกค้า" });
    }

    await prisma.patient.update({
      where: { id: Number(patientId) },
      data: { lineUserId },
    });

    await prisma.pendingLineUser.deleteMany({
      where: { lineUserId },
    });

    res.json({ message: "ผูก Line สำเร็จ" });
  } catch (error) {
    res.status(500).json({
      message: "ไม่สามารถเชื่อม LINE ID กับ User นี้ได้",
      error: error.message,
    });
  }
};
