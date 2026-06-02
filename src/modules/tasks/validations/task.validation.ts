import joi from "joi";

// Checklist item
const checklistItemSchema = joi.object({
  title: joi.string().trim().min(1).max(255).required(),
  isCompleted: joi.boolean().default(false),
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
  checklistItems: joi.array().items(checklistItemSchema).optional(),
});

// Updating a task
export const updateTaskValidation = joi.object({
  ...commonTaskFields,
  checklistItems: joi
    .array()
    .items(
      joi.object({
        id: joi.number().integer().positive(),
        title: joi.string().trim().min(1).max(255).required(),
        isCompleted: joi.boolean().required(),
      })
    )
    .optional(),
});
