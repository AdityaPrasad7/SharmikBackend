import Joi from "joi";

const nameSchema = Joi.string().trim().min(2).max(100);
const statusSchema = Joi.string().valid("Active", "Inactive");
const descriptionSchema = Joi.string().trim().max(500).allow("");

const categoryBaseSchema = {
  name: nameSchema.required(),
  description: descriptionSchema.default(""),
  status: statusSchema.default("Active"),
};

export const createCategorySchema = Joi.object({
  ...categoryBaseSchema,
});

export const updateCategorySchema = Joi.object({
  ...categoryBaseSchema,
}).fork(["name"], (schema) => schema.optional());

export const queryCategorySchema = Joi.object({
  status: statusSchema.optional(),
});

