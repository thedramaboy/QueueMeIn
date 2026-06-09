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
import { validate } from "../middlewares/validate.middleware.js";
import { createBranchSchema } from "../schemas/branch.schema.js";

const router = Router();

router.get("/", auth, getBranches);
router.get("/:id", auth, getBranch);
router.post("/", auth, allowRoles("OWNER"),validate(createBranchSchema), createBranch);
router.put("/:id", auth, allowRoles("OWNER"), updateBranch);
router.delete("/:id", auth, allowRoles("OWNER"), deleteBranch);

export default router;
