import { z } from 'zod'

export const createDoctorSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อหมอ"),
    specialty: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    branchIds: z.array(z.number().int().positive()).min(1, "กรุณาเลือกสาขาอย่างน้อย 1 สาขา")
})

export const updateDoctorSchema = z.object({
    name: z.string().min(1).optional(),
    specialty: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    branchIds: z.array(z.number().int().positive()).min(1).optional(),
})