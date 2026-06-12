import { z } from 'zod'

export const createBranchSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อสาขา"),
    location: z.string().min(1, "กรุณากรอกที่อยู่"),
    phone: z.string().optional().nullable()
})

export const updateBranchSchema = z.object({
    name: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    phone: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
})