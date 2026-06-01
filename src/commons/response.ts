import type { Response } from "express";

export const sendResponse = (
  res: Response,
  statusCode: number,
  payload: {
    message?: string;
    data?: any;
    meta?: any; // meta is for pagination and other meta data
  }
) => {
  const responseBody: Record<string, any> = {};

  if (payload.message !== undefined) responseBody.message = payload.message;
  if (payload.data !== undefined) responseBody.data = payload.data;
  if (payload.meta !== undefined) responseBody.meta = payload.meta;

  return res.status(statusCode).json(responseBody);
};
