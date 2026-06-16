import joi from "joi";
import { titleSchema } from "../../../commons/validations/common.validation.js";

export const addChecklistItemValidation = joi.object({
  title: titleSchema.required(),
});

export const updateChecklistItemApiValidation = joi
  .object({
    title: titleSchema.optional(),
    isCompleted: joi.boolean().optional(),
  })
  .or("title", "isCompleted");

export const getChecklistValidation = joi.object({
  status: joi
    .string()
    .valid("all", "completed", "pending")
    .default("all")
    .optional(),
});
