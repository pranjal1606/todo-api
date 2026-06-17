import { db } from "../../../config/database.js";
import { ChecklistItem } from "../entities/ChecklistItem.js";
import { Task } from "../entities/Task.js";
import { AppError } from "../../../commons/AppError.js";
import { StatusCodes } from "http-status-codes";

const getChecklistItemRepository = () => db.getRepository(ChecklistItem);
const getTaskRepository = () => db.getRepository(Task);

/**
 * Helper to fetch a task and verify user ownership
 */
const getTaskAndVerifyOwnership = async (taskId: number, userId: number) => {
  const task = await getTaskRepository().findOne({
    where: { id: taskId, user: { id: userId } },
  });
  if (!task) {
    throw new AppError("Task not found", StatusCodes.NOT_FOUND);
  }
  return task;
};

/**
 * Helper to fetch a checklist item and verify task association
 */
const getChecklistItemAndVerifyTask = async (
  checklistId: number,
  taskId: number
) => {
  const item = await getChecklistItemRepository().findOne({
    where: { id: checklistId, task: { id: taskId } },
  });
  if (!item) {
    throw new AppError("Checklist item not found", StatusCodes.NOT_FOUND);
  }
  return item;
};

/**
 * Get checklist items for a task with optional status filter
 */
export const getChecklistItems = async (
  userId: number,
  taskId: number,
  status: "all" | "completed" | "pending"
) => {
  // Verify task ownership
  await getTaskAndVerifyOwnership(taskId, userId);

  const findOptions: any = {
    select: ["id", "title", "isCompleted"],
    where: { task: { id: taskId } },
    order: { id: "ASC" },
  };

  if (status === "completed") {
    findOptions.where.isCompleted = true;
  } else if (status === "pending") {
    findOptions.where.isCompleted = false;
  }

  return getChecklistItemRepository().find(findOptions);
};

/**
 * Create a new checklist item under a task
 */
export const createChecklistItem = async (
  userId: number,
  taskId: number,
  title: string
) => {
  // Verify task ownership
  await getTaskAndVerifyOwnership(taskId, userId);

  const checklistItemRepository = getChecklistItemRepository();
  const newItem = checklistItemRepository.create({
    title,
    isCompleted: false,
    task: { id: taskId },
  });

  return checklistItemRepository.save(newItem);
};

/**
 * Update an existing checklist item
 */
export const updateChecklistItem = async (
  userId: number,
  taskId: number,
  checklistId: number,
  updateData: { title?: string; isCompleted?: boolean }
) => {
  // Verify task ownership
  const task = await getTaskAndVerifyOwnership(taskId, userId);

  const checklistItemRepository = getChecklistItemRepository();

  // Verify checklist item exists and belongs to the task
  const item = await getChecklistItemAndVerifyTask(checklistId, taskId);

  // Apply updates
  Object.assign(item, updateData);
  const updatedItem = await checklistItemRepository.save(item);

  // Trigger Business Rule: Auto-mark completed if all items are ticked
  if (updateData.isCompleted !== undefined) {
    const allItems = await checklistItemRepository.find({
      where: { task: { id: taskId } },
    });

    if (allItems.length > 0) {
      const allChecked = allItems.every((itm) => itm.isCompleted);
      if (allChecked && task.status !== "COMPLETED") {
        task.status = "COMPLETED";
        await getTaskRepository().save(task);
      }
    }
  }

  return updatedItem;
};

/**
 * Delete a checklist item
 */
export const deleteChecklistItem = async (
  userId: number,
  taskId: number,
  checklistId: number
) => {
  // Verify task ownership
  await getTaskAndVerifyOwnership(taskId, userId);

  // Verify checklist item exists and belongs to the task
  await getChecklistItemAndVerifyTask(checklistId, taskId);

  await getChecklistItemRepository().delete(checklistId);
};
