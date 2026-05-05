import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", auth, getCategories);
router.post("/", auth, allowRoles("OWNER"), createCategory);
router.put("/:id", auth, allowRoles("OWNER"), updateCategory);
router.delete("/:id", auth, allowRoles("OWNER"), deleteCategory);

export default router;
