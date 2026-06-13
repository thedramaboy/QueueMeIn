import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../schemas/category.schema.js";

const router = Router();

router.get("/", auth, getCategories);
router.post("/", auth, allowRoles("SUPERUSER", "ADMIN"), validate(createCategorySchema), createCategory);
router.put("/:id", auth, allowRoles("SUPERUSER", "ADMIN"), validate(updateCategorySchema), updateCategory);
router.delete("/:id", auth, allowRoles("SUPERUSER", "ADMIN"), deleteCategory);

export default router;
