import { z } from 'zod'

export const createScheduleSchema = z.object({
    branchId: z.number().int().positive("กรุณาเลือกสาขา"),
    doctorId: z.number().int().positive("กรุฯาเลือกหมอ"),
    dayOfWeek: z.number().int().min(0).max(6, "วันไม่ถูกต้อง"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง เช่น 13:00"),
    endTime:   z.string().regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง เช่น 20:00"),
})