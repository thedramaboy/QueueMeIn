import { z } from 'zod'

export const createBranchSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อสาขา"),
    location: z.string().min(1, "กรุณากรอกที่อยู่"),
    phone: z.string().optional().nullable()
})