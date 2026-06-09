import { z } from 'zod'

export const createBookingSchema = z.object({
    patientId: z.number().int().positive("กรุณาเลือกลูกค้า"),
    doctorId: z.number().int().positive("กรุณาเลือกหมอ"),
    branchId: z.number().int().positive("กรุณาเลือกสาขา"),
    serviceId: z.number().int().positive("กรุณาเลือกหัตถการ"),
    date: z.string().min(1, "กรุณาเลือกวันที่"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง เช่น 16:00"),
    deposit: z.number().optional().nullable(),
    note: z.string().optional().nullable()
})

export const updateBookingStatusSchema = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
        {errorMap : () => ({ message: "Status ไม่ถูกต้อง"})}
    )
})

export const rescheduleBookingSchema = z.object({
    date: z.string().min(1, "กรุณาเลือกวันที่"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง เช่น 16:00"),
    note: z.string().optional().nullable()
})