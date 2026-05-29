import joi from "joi";
import { nameValidation } from "../../commons/validations/common.validation.js";

export const createCategoryValidation = joi.object({
  name: nameValidation.required(),
});

export const updateCategoryValidation = joi.object({
  name: nameValidation.optional(),
});
