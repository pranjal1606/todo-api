import multer from "multer";
import path from "path";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../../commons/AppError.js";

const uploadDir = path.join(process.cwd(), "uploads");

// File storing and renaming rules
const storage = multer.diskStorage({
  destination: uploadDir, // Multer automatically ensures this directory exists and if not creates one.
  filename: (req, file, cb) => {
    // Generate safe unique filename using UUID
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

const fileFilter = (req: any, file: any, cb: any) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    ALLOWED_MIME_TYPES.includes(file.mimetype) &&
    ALLOWED_EXTENSIONS.includes(ext)
  ) {
    // null - no error
    // true - accept the file
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Only JPEG, PNG, and PDF files are allowed",
        StatusCodes.BAD_REQUEST
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});
