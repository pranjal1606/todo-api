import joi from "joi";
import jpc from "joi-password-complexity";
import { nameValidation } from "../../commons/validations/common.validation.js";

const emailField = joi.string().email().required();

const complexityOptions = {
  min: 6,
  max: 128,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4,
};

export const regValidation = joi.object({
  name: nameValidation,
  email: emailField,
  password: (jpc as any)(complexityOptions).required(),
});

export const verifyValidation = joi.object({
  email: emailField,
  otp: joi.string().length(6).required(),
});

export const loginValidation = joi.object({
  email: emailField,
  password: joi.string().required(),
});

export const refreshValidation = joi.object({
  refreshToken: joi.string().required(),
});
