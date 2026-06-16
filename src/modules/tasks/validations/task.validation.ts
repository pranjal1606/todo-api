import joi from "joi";
import { titleSchema } from "../../../commons/validations/common.validation.js";

const ALLOWED_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];
const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const status = joi.string().valid(...ALLOWED_STATUSES);
const priority = joi.string().valid(...ALLOWED_PRIORITIES);

// Checklist item schema during task creation (no isCompleted allowed)
const createChecklistItemSchema = joi.object({
  title: titleSchema.required(),
});

// Checklist item schema during task updates
const updateChecklistItemSchema = joi.object({
  id: joi.number().integer().positive().optional(),
  title: titleSchema.required(),
  isCompleted: joi.boolean().required(),
});

// Base schema for shared task validation properties
const baseTaskSchema = joi.object({
  title: titleSchema,
  description: joi.string().trim().max(1000).allow(null, ""),
  status,
  priority,
  dueDate: joi.date().iso().allow(null),
  reminderAt: joi.date().iso().allow(null),
  categoryId: joi.number().integer().positive(),
});

// Schema for creating a task (makes certain fields required and sets defaults)
export const createTaskValidation = baseTaskSchema
  .fork(["title", "categoryId"], (schema) => schema.required())
  .fork(["dueDate", "reminderAt"], (schema) =>
    (schema as joi.DateSchema).optional().allow(null).min("now")
  )
  .fork(["status"], (schema) => schema.default("PENDING"))
  .fork(["priority"], (schema) => schema.default("MEDIUM"))
  .keys({
    checklistItems: joi.array().items(createChecklistItemSchema).optional(),
  });

// Schema for updating a task (keeps all fields optional, nothing empty allowed except description)
export const updateTaskValidation = baseTaskSchema.keys({
  checklistItems: joi.array().items(updateChecklistItemSchema).optional(),
});

// Schema for listing and querying tasks (filtering, sorting, and pagination)
export const getTasksValidation = joi.object({
  page: joi.number().integer().min(1).optional(),
  limit: joi.number().integer().min(1).max(50).optional(),
  status: status.valid("all").optional(),
  priority: priority.valid("all").optional(),
  dueDate: joi.string().isoDate().optional(),
  hasDueDate: joi.boolean().optional(),
  search: joi.string().trim().allow("").optional(),
  sortBy: joi
    .string()
    .valid("dueDate", "createdAt", "priority", "status")
    .optional(),
  order: joi.string().valid("ASC", "DESC").optional(),
});
