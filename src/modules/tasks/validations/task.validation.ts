import joi from "joi";

// Checklist item schema during creation (no isCompleted parameter allowed)
const createChecklistItemSchema = joi.object({
  title: joi.string().trim().min(1).max(255).required(),
});

// Shared base task validation properties
const commonTaskFields = {
  title: joi.string().trim().min(3).max(255),
  description: joi.string().trim().max(1000).allow(null, ""),
  status: joi.string().valid("PENDING", "IN_PROGRESS", "COMPLETED"),
  priority: joi.string().valid("LOW", "MEDIUM", "HIGH"),
  dueDate: joi.date().iso(),
  reminderAt: joi.date().iso().allow(null),
  categoryId: joi.number().integer().positive(),
};

// Creating a task
export const createTaskValidation = joi.object({
  ...commonTaskFields,
  title: commonTaskFields.title.required(),
  dueDate: commonTaskFields.dueDate.required(),
  categoryId: commonTaskFields.categoryId.required(),
  status: commonTaskFields.status.default("PENDING"),
  priority: commonTaskFields.priority.default("MEDIUM"),
  checklistItems: joi.array().items(createChecklistItemSchema).optional(), // Optional, no isCompleted allowed
});

// Updating a task (nothing empty allowed except description)
export const updateTaskValidation = joi.object({
  ...commonTaskFields,
  checklistItems: joi
    .array()
    .items(
      joi.object({
        id: joi.number().integer().positive(), // ID to target existing checklist items
        title: joi.string().trim().min(1).max(255).required(),
        isCompleted: joi.boolean().required(),
      })
    )
    .optional(),
});

// Listing/Querying tasks validation schema
export const getTasksValidation = joi.object({
  page: joi.number().integer().min(1).optional(),
  limit: joi.number().integer().min(1).max(50).optional(),
  status: joi
    .string()
    .valid("PENDING", "IN_PROGRESS", "COMPLETED", "all")
    .optional(),
  priority: joi.string().valid("LOW", "MEDIUM", "HIGH", "all").optional(),
  dueDate: joi.string().isoDate().optional(),
  hasDueDate: joi.boolean().optional(),
  search: joi.string().trim().allow("").optional(),
  sortBy: joi
    .string()
    .valid("dueDate", "createdAt", "priority", "status")
    .optional(),
  order: joi.string().valid("ASC", "DESC").optional(),
});
