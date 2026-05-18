import prisma from "../utils/prisma.js";

export const handleWebhook = async (req, res) => {
  res.sendStatus(200);

  const events = req.body.events;
  if (!events || events.length === 0) return;

  for (const event of events) {
    const lineUserId = event.source?.userId;
    if (!lineUserId) continue;

    if (event.type === "follow") {
      console.log("New follower:", lineUserId);
    }

    if (event.type === "message") {
      console.log("Message from:", lineUserId, event.message?.text);
    }
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

    res.json({ message: "ผูก Line สำเร็จ" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "ไม่สามารถเชื่อม Line ID กับ User นี้ได้",
        error: error.message,
      });
  }
};
