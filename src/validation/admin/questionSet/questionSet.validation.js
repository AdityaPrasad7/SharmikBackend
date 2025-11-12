import Joi from "joi";

const nameSchema = Joi.string().trim().min(2).max(120);

const objectIdSchema = Joi.string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid object id");

const optionSchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
  isCorrect: Joi.boolean().optional(),
});

const questionSchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
  options: Joi.array()
    .items(optionSchema)
    .min(2)
    .required()
    .custom((options, helpers) => {
      if (!options.some((option) => option.isCorrect)) {
        return helpers.error("any.invalid", {
          message: "Each question must have at least one correct option",
        });
      }
      return options;
    }),
});

const baseSchema = {
  name: nameSchema.optional(),
  specializationIds: Joi.array()
    .items(objectIdSchema)
    .min(1)
    .required()
    .messages({
      "array.min": "At least one specialization must be selected",
    }),
  questions: Joi.array().items(questionSchema).default([]),
  totalQuestions: Joi.number().integer().min(0).default(Joi.ref("questions.length")),
};

export const createQuestionSetSchema = Joi.object({
  ...baseSchema,
});

export const updateQuestionSetSchema = Joi.object({
  ...baseSchema,
}).fork(["name", "specializationIds"], (schema) => schema.optional());

export const queryQuestionSetSchema = Joi.object({});


