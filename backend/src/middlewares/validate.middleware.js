import logger from "../utils/logger.js";

export const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body)

        if (!result.success) {
            const errors = result.error.errors.map((error) => ({
                field: error.path.join('.'),
                message: error.message
            }))
        }

        logger.warn("Validation failed", {
            method: req.method,
            url: req.url,
            errors
        })

        return res.status(400).json({
            message: "ข้อมูลไม่ถูกต้อง",
            errors
        })

        req.body = result.data
        next()
    }
}