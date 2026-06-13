import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อ"),
    email: z.string().email("รูปแบบ Email ไม่ถูกต้อง"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    role: z.enum(["OWNER", "STAFF"], { errorMap: () => ({ message: "Role ไม่ถูกต้อง" }) }),
    branchId: z.number().int().positive().optional().nullable(),
});

export const updateUserSchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อ").optional(),
    role: z.enum(["OWNER", "STAFF"], { errorMap: () => ({ message: "Role ไม่ถูกต้อง" }) }).optional(),
    branchId: z.number().int().positive().optional().nullable(),
    isActive: z.boolean().optional(),
});
