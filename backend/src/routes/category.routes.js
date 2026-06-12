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
router.post("/", auth, allowRoles("OWNER"),validate(createCategorySchema), createCategory);
router.put("/:id", auth, allowRoles("OWNER"), validate(updateCategorySchema), updateCategory);
router.delete("/:id", auth, allowRoles("OWNER"), deleteCategory);

export default router;
