import joi from "joi";
import { nameValidation } from "../common.validation.js";

export const createCategoryValidation = joi.object({
  name: nameValidation.required(),
});

export const updateCategoryValidation = joi.object({
  name: nameValidation.optional(),
});
