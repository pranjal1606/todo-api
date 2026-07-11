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
 * Helper to map raw file data to the Attachment entity format
 */
const mapFileToAttachmentData = (
  taskId: number,
  file: { filename: string; mimetype: string; size: number }
) => {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  return {
    filename: file.filename,
    url: `${baseUrl}/files/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size,
    task: { id: taskId },
  };
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

  const attachmentRepository = getAttachmentRepository();

  // 2. Validate current attachment count (max 5)
  const currentCount = await attachmentRepository.count({
    where: { task: { id: taskId } },
  });
  if (currentCount >= 5) {
    throw new AppError(
      "Maximum of 5 attachments allowed per task.",
      StatusCodes.BAD_REQUEST
    );
  }

  // 3. Save attachment
  const attachment = attachmentRepository.create(
    mapFileToAttachmentData(taskId, fileData)
  );
  await attachmentRepository.save(attachment);

  // 4. Return updated task
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
 * Soft delete an attachment by ID (from DB only), ensuring ownership of its task
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

  // 2. Soft delete from DB (keep physical file on disk for restorability)
  await attachmentRepository.softDelete(attachmentId);

  // 3. Return updated task
  return getUpdatedTask(taskId, userId);
};

/**
 * Save multiple file attachments to DB
 */
export const createAttachments = async (
  taskId: number,
  filesData: Array<{
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  }>
) => {
  const attachmentRepository = getAttachmentRepository();
  const attachments = filesData.map((file) =>
    attachmentRepository.create(mapFileToAttachmentData(taskId, file))
  );
  return await attachmentRepository.save(attachments);
};
