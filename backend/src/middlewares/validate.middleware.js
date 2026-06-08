import logger from "../utils/logger.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const body   = req.body || {}
    const result = schema.safeParse(body)

    if (!result.success) {
      const issues = result.error.issues || result.error.errors || []

      const errors = issues.map((issue) => ({
        field:   issue.path.join('.'),
        message: issue.message
      }))

      logger.warn("Validation failed", {
        method: req.method,
        url:    req.url,
        errors
      })

      return res.status(400).json({
        message: "ข้อมูลไม่ถูกต้อง",
        errors
      })
    }

    req.body = result.data
    next()
  }
}