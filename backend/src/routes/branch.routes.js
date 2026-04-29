import { Router } from "express";
import {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} from "../controllers/branch.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = Router();

router.get("/", auth, getBranches);
router.get("/:id", auth, getBranch);
router.post("/", auth, allowRoles("OWNER"), createBranch);
router.put("/:id", auth, allowRoles("OWNER"), updateBranch);
router.delete("/:id", auth, allowRoles("OWNER"), deleteBranch);

export default router;
