import joi from "joi";
import { nameValidation } from "../../commons/validations/common.validation.js";

export const createCategoryValidation = joi.object({
  name: nameValidation,
});

export const updateCategoryValidation = joi.object({
  name: nameValidation,
});
