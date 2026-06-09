import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email("Email ไม่ถูกต้อง"),
  password: z.string().min(6, "Password อย่างน้อย 6 ตัวอักษร")
})