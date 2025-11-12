import Joi from "joi";

const nameSchema = Joi.string().trim().min(2).max(100);
const statusSchema = Joi.string().valid("Active", "Inactive");

const specializationBaseSchema = {
  name: nameSchema.required(),
  status: statusSchema.default("Active"),
  skills: Joi.array().items(Joi.string().trim().min(1)).default([]),
};

export const createSpecializationSchema = Joi.object({
  ...specializationBaseSchema,
});

export const updateSpecializationSchema = Joi.object({
  ...specializationBaseSchema,
}).fork(["name"], (schema) => schema.optional());

export const querySpecializationSchema = Joi.object({
  status: statusSchema.optional(),
});


