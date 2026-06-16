import { db } from "../../../config/database.js";
import { Task } from "../entities/Task.js";
import { ChecklistItem } from "../entities/ChecklistItem.js";
import { Brackets } from "typeorm";
import { findUser } from "../../auth/services/user.service.js";
import { getCategoryByIdAndUser } from "../../categories/category.service.js";
import { AppError } from "../../../commons/AppError.js";
import { StatusCodes } from "http-status-codes";
import {
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  getChecklistItems,
} from "./checklist.service.js";

const taskRepository = db.getRepository(Task);

const checkUserExists = async (userId: number) => {
  const user = await findUser({ id: userId });
  if (!user || user.deletedAt) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }
  return user;
};

// Interface for task payload inputs
export interface TaskInput {
  title: string;
  description?: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  categoryId: number;
  checklistItems?: { id?: number; title: string; isCompleted: boolean }[];
  dueDate?: Date | null;
  reminderAt?: Date | null;
}

// Interface for paginated task querying and filtering
export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "all";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "all";
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  hasDueDate?: boolean;
  search?: string;
  sortBy?: "dueDate" | "createdAt" | "priority" | "status";
  order?: "ASC" | "DESC";
}

export const createTask = async (userId: number, taskData: TaskInput) => {
  try {
    // 1. Verify user exists
    await checkUserExists(userId);

    const { checklistItems, categoryId, ...rest } = taskData;

    // 2. Verify category exists and belongs to the user if categoryId is provided
    if (categoryId) {
      const category = await getCategoryByIdAndUser(categoryId, userId);
      if (!category) {
        throw new AppError(
          "Category not found or does not belong to the user",
          StatusCodes.BAD_REQUEST
        );
      }
    }

    // Force checklist items to not be completed at creation time
    const formattedChecklist = checklistItems
      ? checklistItems.map((item) => ({
          title: item.title,
          isCompleted: false,
        }))
      : [];

    const status = rest.status || "PENDING";

    // Unified direct save using TypeORM cascade inserts. It automatically inserts checklist items.
    return await taskRepository.save({
      ...rest,
      status,
      user: { id: userId },
      category: categoryId ? { id: categoryId } : null,
      checklistItems: formattedChecklist,
    });
  } catch (error) {
    throw error;
  }
};

export const getTasksPaginated = async (
  userId: number,
  filters: TaskFilters
) => {
  try {
    // 1. Verify user exists
    await checkUserExists(userId);

    const {
      page = 1,
      limit = 10,
      status,
      priority,
      dueDate,
      hasDueDate,
      search,
      sortBy = "createdAt",
      order = "DESC",
    } = filters;

    const parsedPage = Math.max(1, page);
    const parsedLimit = Math.max(1, Math.min(50, limit));
    const skip = (parsedPage - 1) * parsedLimit;

    const query = taskRepository
      .createQueryBuilder("task")
      .leftJoinAndSelect("task.category", "category")
      .leftJoinAndSelect("task.checklistItems", "checklistItem")
      .leftJoinAndSelect("task.attachments", "attachment")
      .where("task.user = :userId", { userId });

    // Filter by Status
    if (status && status !== "all") {
      query.andWhere("task.status = :status", { status });
    }

    // Filter by Priority
    if (priority && priority !== "all") {
      query.andWhere("task.priority = :priority", { priority });
    }

    // Filter by Due Date
    if (dueDate) {
      const startOfDay = new Date(dueDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(dueDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.andWhere("task.dueDate BETWEEN :startOfDay AND :endOfDay", {
        startOfDay,
        endOfDay,
      });
    } else if (hasDueDate !== undefined) {
      const hasDueDateBool = String(hasDueDate) === "true";
      if (hasDueDateBool) {
        query.andWhere("task.dueDate IS NOT NULL");
      } else {
        query.andWhere("task.dueDate IS NULL");
      }
    }

    // Relational Multi-Field case-insensitive search
    if (search) {
      const searchPattern = `%${search}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where("task.title ILIKE :search", { search: searchPattern })
            .orWhere("task.description ILIKE :search", {
              search: searchPattern,
            })
            .orWhere("category.name ILIKE :search", { search: searchPattern })
            .orWhere(
              "EXISTS (SELECT 1 FROM checklist_items ci WHERE ci.task_id = task.id AND ci.title ILIKE :search)",
              { search: searchPattern }
            );
        })
      );
    }

    // Sorting
    const orderDirection = order || "DESC";
    if (sortBy === "priority") {
      query.addSelect(
        `CASE task.priority 
          WHEN 'HIGH' THEN 1 
          WHEN 'MEDIUM' THEN 2 
          WHEN 'LOW' THEN 3 
        END`,
        "task_priority_order"
      );
      query.orderBy("task_priority_order", orderDirection);
    } else if (sortBy === "status") {
      query.addSelect(
        `CASE task.status 
          WHEN 'PENDING' THEN 1 
          WHEN 'IN_PROGRESS' THEN 2 
          WHEN 'COMPLETED' THEN 3 
        END`,
        "task_status_order"
      );
      query.orderBy("task_status_order", orderDirection);
    } else if (sortBy === "dueDate") {
      query.orderBy("task.dueDate", orderDirection, "NULLS LAST");
    } else {
      query.orderBy(`task.${sortBy}`, orderDirection);
    }

    const [tasks, total] = await query
      .take(parsedLimit)
      .skip(skip)
      .getManyAndCount();

    return {
      tasks,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    };
  } catch (error) {
    throw error;
  }
};

export const getTaskByIdAndUser = async (taskId: number, userId: number) => {
  try {
    // 1. Verify user exists
    await checkUserExists(userId);

    return await taskRepository.findOne({
      where: { id: taskId, user: { id: userId } },
      relations: { category: true, checklistItems: true, attachments: true },
    });
  } catch (error) {
    throw error;
  }
};

export const updateTask = async (
  taskId: number,
  userId: number,
  updateData: Partial<TaskInput>
) => {
  try {
    // 1. Verify user exists
    await checkUserExists(userId);

    // 2. Verify task exists and belongs to the user
    const task = await taskRepository.findOne({
      where: { id: taskId, user: { id: userId } },
      relations: { checklistItems: true, category: true, attachments: true },
    });
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    const { checklistItems, categoryId, ...rest } = updateData;

    // 3. Verify category exists and belongs to user if categoryId is provided
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await getCategoryByIdAndUser(categoryId, userId);
        if (!category) {
          throw new AppError(
            "Category not found or does not belong to the user",
            StatusCodes.BAD_REQUEST
          );
        }
        task.category = category;
      } else {
        task.category = null;
      }
    }

    // 4. Verify checklist items belong to the task if provided
    if (checklistItems) {
      const existingIds = task.checklistItems.map((item) => item.id);
      for (const item of checklistItems) {
        if (item.id && !existingIds.includes(item.id)) {
          throw new AppError(
            `Checklist item with ID ${item.id} does not belong to this task`,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      // Explicitly delete orphaned checklist items using deleteChecklistItem
      const incomingIds = checklistItems
        .map((item) => item.id)
        .filter((id): id is number => !!id);
      const existingChecklistIds = existingIds.filter(
        (id) => !incomingIds.includes(id)
      );
      for (const checklistId of existingChecklistIds) {
        await deleteChecklistItem(userId, taskId, checklistId);
      }

      // Create or update items using createChecklistItem and updateChecklistItem
      for (const item of checklistItems) {
        if (item.id) {
          await updateChecklistItem(userId, taskId, item.id, {
            title: item.title,
            isCompleted: item.isCompleted,
          });
        } else {
          await createChecklistItem(userId, taskId, item.title);
        }
      }

      // Reload checklist items from the database to reflect the updates
      task.checklistItems = await getChecklistItems(userId, taskId, "all");

      // Business Rule: Auto-mark completed if all items are ticked
      if (task.checklistItems.length > 0) {
        const allChecked = task.checklistItems.every(
          (item) => item.isCompleted
        );
        if (allChecked) {
          task.status = "COMPLETED";
        }
      }
    }

    Object.assign(task, rest);

    return await taskRepository.save(task);
  } catch (error) {
    throw error;
  }
};

export const deleteTask = async (taskId: number, userId: number) => {
  try {
    // 1. Verify user exists
    await checkUserExists(userId);

    // 2. Verify task exists and belongs to the user
    const task = await taskRepository.findOne({
      where: { id: taskId, user: { id: userId } },
    });
    if (!task) {
      throw new AppError("Task not found", StatusCodes.NOT_FOUND);
    }

    await taskRepository.softDelete(taskId);
  } catch (error) {
    throw error;
  }
};
