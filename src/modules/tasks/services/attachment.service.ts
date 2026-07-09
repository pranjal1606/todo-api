import { db } from "../../../config/database.js";
import { Attachment } from "../entities/Attachment.js";
import { Task } from "../entities/Task.js";
import { AppError } from "../../../commons/AppError.js";
import { StatusCodes } from "http-status-codes";
import fs from "fs";
import { getTaskByIdAndUser } from "./task.service.js";

const getTaskRepository = () => db.getRepository(Task);
const getAttachmentRepository = () => db.getRepository(Attachment);

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
 * Helper to fetch a task with loaded relations and verify existence
 */
const getUpdatedTask = async (taskId: number, userId: number) => {
  const updatedTask = await getTaskByIdAndUser(taskId, userId);
  if (!updatedTask) {
    throw new AppError("Task not found", StatusCodes.NOT_FOUND);
  }
  return updatedTask;
};

/**
 * Save file attachment to DB and return the updated task
 */
export const createAttachment = async (
  userId: number,
  taskId: number,
  fileData: { filename: string; path: string; mimetype: string; size: number }
) => {
  // 1. Verify task ownership
  await getTaskAndVerifyOwnership(taskId, userId);

  // 2. Save attachment
  const attachmentRepository = getAttachmentRepository();
  const attachment = attachmentRepository.create({
    ...fileData,
    task: { id: taskId },
  });
  await attachmentRepository.save(attachment);

  // 3. Return updated task
  return getUpdatedTask(taskId, userId);
};

/**
 * Retrieve an attachment by ID, ensuring ownership of its task
 */
export const getAttachmentById = async (
  userId: number,
  taskId: number,
  attachmentId: number
) => {
  // 1. Verify task ownership
  await getTaskAndVerifyOwnership(taskId, userId);

  // 2. Find attachment
  const attachment = await getAttachmentRepository().findOne({
    where: { id: attachmentId, task: { id: taskId } },
  });

  if (!attachment) {
    throw new AppError("Attachment not found", StatusCodes.NOT_FOUND);
  }

  return attachment;
};

/**
 * Delete an attachment by ID (from disk and DB), ensuring ownership of its task
 */
export const deleteAttachment = async (
  userId: number,
  taskId: number,
  attachmentId: number
) => {
  // 1. Verify task ownership
  await getTaskAndVerifyOwnership(taskId, userId);

  const attachmentRepository = getAttachmentRepository();
  const attachment = await attachmentRepository.findOne({
    where: { id: attachmentId, task: { id: taskId } },
  });

  if (!attachment) {
    throw new AppError("Attachment not found", StatusCodes.NOT_FOUND);
  }

  // 2. Delete physically from disk
  if (fs.existsSync(attachment.path)) {
    fs.unlinkSync(attachment.path);
  }

  // 3. Delete from DB
  await attachmentRepository.delete(attachmentId);

  // 4. Return updated task
  return getUpdatedTask(taskId, userId);
};
