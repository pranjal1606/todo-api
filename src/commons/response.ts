import type { Response } from "express";

function stripDates(val: any): any {
  if (val === null || val === undefined) {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(stripDates);
  }
  if (val instanceof Date) {
    return val;
  }
  if (typeof val === "object") {
    let obj = val;
    if (typeof val.toJSON === "function") {
      try {
        obj = val.toJSON();
        if (
          obj === null ||
          obj === undefined ||
          typeof obj !== "object" ||
          obj instanceof Date
        ) {
          return obj;
        }
      } catch (e) {
        obj = val;
      }
    }
    const copy: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (key === "createdAt" || key === "updatedAt") {
        continue;
      }
      copy[key] = stripDates(obj[key]);
    }
    return copy;
  }
  return val;
}

export const sendResponse = (
  res: Response,
  statusCode: number,
  payload: {
    message?: string;
    data?: any;
    meta?: any; // meta is for pagination and other meta data
  }
) => {
  const responseBody: Record<string, any> = {
    statusCode,
  };

  if (payload.message !== undefined) responseBody.message = payload.message;
  if (payload.data !== undefined) responseBody.data = stripDates(payload.data);
  if (payload.meta !== undefined) responseBody.meta = payload.meta;

  return res.status(statusCode).json(responseBody);
};
