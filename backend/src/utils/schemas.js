import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email("Email ไม่ถูกต้อง"),
    password: z.string().min(6, "Password อย่างน้อย 6 ตัวอักษร")
})

export const createPatientSchema = z.object({
    opdNumber: z.string().min(1, "กรุณากรอกเลข OPD"),
    firstName: z.string().min(1, "กรุณากรอกชื่อ"),
    lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
    phone: z.string().min(9, "เบอร์โทรไม่ถูกต้อง").max(10, "เบอร์โทรไม่ถูกต้อง"),
    nationalId: z.string().length(13, "เลขบัตรประชาชนต้องมี 13 หลัก").optional().nullable(),
    nickname: z.string().optional().nullable(),
    age: z.number().int().min(1).max(100).optional().nullable(),
    allergyHistory: z.string().optional().nullable(),
    lineUserId: z.string().optional().nullable()
})

export const updatePatientSchema = z.object({
    firstName: z.string().min(1, "กรุณากรอกชื่อ").optional(),
    lastName: z.string().min(1, "กรุณากรอกนามสกุล").optional(),
    phone: z.string().min(9).max(10).optional(),
    nickname: z.string().optional().nullable(),
    age: z.number().int().min(1).max(100).optional().nullable(),
    allergyHistory: z.string().optional().nullable(),
    lineUserId: z.string().optional().nullable()
})

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

export const createDoctorSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อหมอ"),
    specialty: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    branchIds: z.array(z.number().int().positive()).min(1, "กรุณาเลือกสาขาอย่างน้อย 1 สาขา")
})

export const createBranchSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อสาขา"),
    location: z.string().min(1, "กรุณากรอกที่อยู่"),
    phone: z.string().optional().nullable()
})

export const createScheduleSchema = z.object({
    branchId: z.number().int().positive("กรุณาเลือกสาขา"),
    doctorId: z.number().int().positive("กรุฯาเลือกหมอ"),
    dayOfWeek: z.number().int().min(0).max(6, "วันไม่ถูกต้อง"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง เช่น 13:00"),
    endTime:   z.string().regex(/^\d{2}:\d{2}$/, "เวลาไม่ถูกต้อง เช่น 20:00"),
})

export const createCategorySchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่")
})

export const createServiceSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อหัตถการ"),
    categoryId: z.number().int().positive("กรุณาเลือกหมวดหมู่"),
    duration: z.number().int().min(1, "ระยะเวลาต้องมากกว่า 0 นาที"),
    price: z.number().optional().nullable(),
    description: z.string().optional().nullable()
})