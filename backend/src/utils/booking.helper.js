import { format } from "date-fns";

// Generate booking number
export const generateBookingNo = (date) => {
  const dateStr = format(new Date(date), "yyyyMMdd");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `BK-${dateStr}-${random}`;
};

export const calculateEndTime = (startTime, duration) => {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
};

export const isSlotAvailable = async (
  prisma,
  { doctorId, branchId, date, startTime, endTime, excludeBookingId },
) => {
  const bookings = await prisma.booking.findMany({
    where: {
      doctorId: Number(doctorId),
      branchId: Number(branchId),
      date: new Date(date),
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      ...(excludeBookingId && {
        id: { not: Number(excludeBookingId) },
      }),
    },
  });

  for (const booking of bookings) {
    const existingStart = booking.startTime;
    const existingEnd = booking.endTime;

    if (startTime < existingEnd && endTime > existingStart) {
      return false;
    }
  }

  return true;
};
