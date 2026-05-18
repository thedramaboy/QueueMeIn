import cron from "node-cron";
import prisma from "../utils/prisma.js";
import { sendMessage, buildReminderMessage } from "../services/line.service.js";

export const startReminderJob = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("🔔 Checking notifications...");

    try {
      const notifications = await prisma.notification.findMany({
        where: {
          status: "PENDING",
          scheduledAt: { lte: new Date() },
        },
        include: {
          booking: {
            include: {
              patient: true,
              service: true,
              doctor: true,
              branch: true,
            },
          },
        },
      });

      console.log(`📨 Found ${notifications.length} notifications to send.`);

      for (const notification of notifications) {
        const { booking } = notification;
        const lineUserId = booking.patient?.lineUserId;

        if (!lineUserId) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: {
              status: "FAILED",
              error: "ไม่มี LINE User ID",
              sentAt: new Date(),
            },
          });
          continue;
        }

        const message = buildReminderMessage(booking, notification.type);
        if (!message) continue;

        const success = await sendMessage(lineUserId, message);
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: success ? "SENT" : "FAILED",
            sentAt: new Date(),
            message: message,
            error: success ? null : `ส่งไม่สำเร็จ`,
          },
        });

        console.log(
          `${success ? "✅" : "❌"} ${notification.type} → ${booking.patient.firstName} `,
        );
      }
    } catch (error) {
      console.error("Reminder job error:", error.message);
    }
  });

  console.log("✅ Reminder job started");
};
