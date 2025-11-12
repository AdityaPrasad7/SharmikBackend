import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../../../controllers/admin/category/category.controller.js";
import { verifyJWT } from "../../../middlewares/authMiddleware.js";
import { validateRequest } from "../../../middlewares/admin/category/validateCategory.js";
import {
  createCategorySchema,
  queryCategorySchema,
  updateCategorySchema,
} from "../../../validation/admin/category/category.validation.js";

const router = Router();

router.use(verifyJWT());

router
  .route("/")
  .get(validateRequest(queryCategorySchema, "query"), getAllCategories)
  .post(validateRequest(createCategorySchema), createCategory);

router
  .route("/:id")
  .get(getCategoryById)
  .put(validateRequest(updateCategorySchema), updateCategory)
  .delete(deleteCategory);

export default router;

