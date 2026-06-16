import { db } from "../../../config/database.js";
import { ChecklistItem } from "../entities/ChecklistItem.js";
import { Task } from "../entities/Task.js";
import { AppError } from "../../../commons/AppError.js";
import { StatusCodes } from "http-status-codes";

const getChecklistItemRepository = () => db.getRepository(ChecklistItem);
const getTaskRepository = () => db.getRepository(Task);

/**
 * Get checklist items for a task with optional status filter
 */
export const getChecklistItems = async (
  userId: number,
  taskId: number,
  status: "all" | "completed" | "pending"
) => {
  try {
    // 1. Verify task exists and belongs to the user
    const task = await getTaskRepository().findOne({
      where: { id: taskId, user: { id: userId } },
    });
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const checklistItemRepository = getChecklistItemRepository();

    const findOptions: any = {
      where: { task: { id: taskId } },
      order: { id: "ASC" },
    };

    if (status === "completed") {
      findOptions.where.isCompleted = true;
    } else if (status === "pending") {
      findOptions.where.isCompleted = false;
    }

    return await checklistItemRepository.find(findOptions);
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new checklist item under a task
 */
export const createChecklistItem = async (
  userId: number,
  taskId: number,
  title: string
) => {
  try {
    // 1. Verify task exists and belongs to the user
    const task = await getTaskRepository().findOne({
      where: { id: taskId, user: { id: userId } },
    });
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const checklistItemRepository = getChecklistItemRepository();
    const newItem = checklistItemRepository.create({
      title,
      isCompleted: false,
      task: { id: taskId },
    });

    return await checklistItemRepository.save(newItem);
  } catch (error) {
    throw error;
  }
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
  try {
    // 1. Verify task exists and belongs to the user
    const task = await getTaskRepository().findOne({
      where: { id: taskId, user: { id: userId } },
    });
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const checklistItemRepository = getChecklistItemRepository();

    // 2. Verify checklist item exists and belongs to the task
    const item = await checklistItemRepository.findOne({
      where: { id: checklistId, task: { id: taskId } },
    });

    if (!item) {
      throw new AppError("Checklist item not found", StatusCodes.NOT_FOUND);
    }

    // 3. Apply updates
    Object.assign(item, updateData);
    const updatedItem = await checklistItemRepository.save(item);

    // 4. Trigger Business Rule: Auto-mark completed if all items are ticked
    if (updateData.isCompleted !== undefined) {
      const allItems = await checklistItemRepository.find({
        where: { task: { id: taskId } },
      });

      if (allItems.length > 0) {
        const allChecked = allItems.every((itm) => itm.isCompleted);
        if (allChecked) {
          task.status = "COMPLETED";
          await getTaskRepository().save(task);
        }
      }
    }

    return updatedItem;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a checklist item
 */
export const deleteChecklistItem = async (
  userId: number,
  taskId: number,
  checklistId: number
) => {
  try {
    // 1. Verify task exists and belongs to the user
    const task = await getTaskRepository().findOne({
      where: { id: taskId, user: { id: userId } },
    });
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const checklistItemRepository = getChecklistItemRepository();

    // 2. Verify checklist item exists and belongs to the task
    const item = await checklistItemRepository.findOne({
      where: { id: checklistId, task: { id: taskId } },
    });

    if (!item) {
      throw new AppError("Checklist item not found", StatusCodes.NOT_FOUND);
    }

    await checklistItemRepository.delete(checklistId);
  } catch (error) {
    throw error;
  }
};
