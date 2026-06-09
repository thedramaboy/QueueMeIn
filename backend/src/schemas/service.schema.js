import { z } from 'zod'

export const createServiceSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อหัตถการ"),
    categoryId: z.number().int().positive("กรุณาเลือกหมวดหมู่"),
    duration: z.number().int().min(1, "ระยะเวลาต้องมากกว่า 0 นาที"),
    price: z.number().optional().nullable(),
    description: z.string().optional().nullable()
})