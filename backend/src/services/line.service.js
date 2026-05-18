import axios from "axios";

const LINE_API = "https://api.line.me/v2/bot/message";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
});

export const sendMessage = async (lineUserId, message) => {
  try {
    await axios.post(
      `${LINE_API}/push`,
      {
        to: lineUserId,
        messages: [{ type: "text", text: message }],
      },
      { headers: getHeaders() },
    );
    return true;
  } catch (error) {
    console.error("LINE send error:", error.response?.data || error.message);
    return false;
  }
};

export const buildReminderMessage = (booking, type) => {
  const { patient, service, doctor, branch, startTime, date } = booking;

  const name = patient.nickname || patient.firstName;
  const dateStr = new Date(date).toLocaleDateString("th-TH", {
    year: "buddhist",
    month: "long",
    day: "numeric",
  });

  if (type === "REMINDER_DAY_BEFORE") {
    return `สวัสดีค่ะคุณ ${name} 😊
            แจ้งเตือนนัดพรุ่งนี้นะคะ
            📅 วันที่  : ${dateStr}
            ⏰ เวลา   : ${startTime} น.
            💉 หัตถการ : ${service.name}
            🏥 สาขา   : ${branch.name}
            👨‍⚕️ แพทย์ : ${doctor.name}
            หากต้องการเลื่อนนัดติดต่อได้เลยค่ะ 🙏`;
  }

  if (type === "REMINDER_MORNING") {
    return `สวัสดีตอนเช้าค่ะคุณ ${name} ☀️
            วันนี้มีนัดนะคะ
            ⏰ เวลา   : ${startTime} น.
            💉 หัตถการ : ${service.name}
            🏥 สาขา   : ${branch.name}
            👨‍⚕️ แพทย์ : ${doctor.name}
            เดินทางปลอดภัยนะคะ 🙏`;
  }
  return null;
};
