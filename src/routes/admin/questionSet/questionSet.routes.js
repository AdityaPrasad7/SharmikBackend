import { Router } from "express";
import {
  createQuestionSet,
  deleteQuestionSet,
  getQuestionSetById,
  getQuestionSets,
  updateQuestionSet,
} from "../../../controllers/admin/questionSet/questionSet.controller.js";
import { verifyJWT } from "../../../middlewares/authMiddleware.js";
import { validateRequest } from "../../../middlewares/admin/questionSet/validateQuestionSet.js";
import {
  createQuestionSetSchema,
  queryQuestionSetSchema,
  updateQuestionSetSchema,
} from "../../../validation/admin/questionSet/questionSet.validation.js";

const router = Router();

router.use(verifyJWT());

router
  .route("/")
  .get(validateRequest(queryQuestionSetSchema, "query"), getQuestionSets)
  .post(validateRequest(createQuestionSetSchema), createQuestionSet);

router
  .route("/:id")
  .get(getQuestionSetById)
  .put(validateRequest(updateQuestionSetSchema), updateQuestionSet)
  .delete(deleteQuestionSet);

export default router;


