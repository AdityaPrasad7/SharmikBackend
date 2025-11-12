import { Router } from "express";
import {
  createSpecialization,
  deleteSpecialization,
  getAllSpecializations,
  getSpecializationById,
  updateSpecialization,
} from "../../../controllers/admin/specialization/specialization.controller.js";
import { verifyJWT } from "../../../middlewares/authMiddleware.js";
import { validateRequest } from "../../../middlewares/admin/specialization/validateSpecialization.js";
import {
  createSpecializationSchema,
  querySpecializationSchema,
  updateSpecializationSchema,
} from "../../../validation/admin/specialization/specialization.validation.js";

const router = Router();

router.use(verifyJWT());

router
  .route("/")
  .get(validateRequest(querySpecializationSchema, "query"), getAllSpecializations)
  .post(validateRequest(createSpecializationSchema), createSpecialization);

router
  .route("/:id")
  .get(getSpecializationById)
  .put(validateRequest(updateSpecializationSchema), updateSpecialization)
  .delete(deleteSpecialization);

export default router;


