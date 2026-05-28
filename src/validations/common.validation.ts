import joi from "joi";

export const nameValidation = joi.string().trim().min(3).max(100);
