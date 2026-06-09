import { z } from 'zod'

export const createPatientSchema = z.object({
  opdNumber:      z.string().min(1, "กรุณากรอกเลข OPD"),
  firstName:      z.string().min(1, "กรุณากรอกชื่อ"),
  lastName:       z.string().min(1, "กรุณากรอกนามสกุล"),
  phone:          z.string().min(9).max(10, "เบอร์โทรไม่ถูกต้อง"),
  nationalId:     z.string().length(13).optional().nullable(),
  nickname:       z.string().optional().nullable(),
  age:            z.number().int().min(1).max(100).optional().nullable(),
  allergyHistory: z.string().optional().nullable(),
  lineUserId:     z.string().optional().nullable(),
})

export const updatePatientSchema = z.object({
  firstName:      z.string().min(1).optional(),
  lastName:       z.string().min(1).optional(),
  phone:          z.string().min(9).max(10).optional(),
  nickname:       z.string().optional().nullable(),
  age:            z.number().int().min(1).max(100).optional().nullable(),
  allergyHistory: z.string().optional().nullable(),
  lineUserId:     z.string().optional().nullable(),
})