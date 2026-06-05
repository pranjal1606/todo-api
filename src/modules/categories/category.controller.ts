import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as categoryService from "./category.service.js";
import { AppError } from "../../commons/AppError.js";
import { sendResponse } from "../../commons/response.js";

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;

    const existingCategory = await categoryService.getCategoryByNameAndUser(
      name,
      userId
    );
    if (existingCategory) {
      throw new AppError(
        "Category with this name already exists",
        StatusCodes.CONFLICT
      );
    }

    const category = await categoryService.createCategory(userId, name);
    sendResponse(res, StatusCodes.CREATED, {
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const categories = await categoryService.getCategoriesByUser(userId);

    sendResponse(res, StatusCodes.OK, {
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id as string, 10);
    const { name } = req.body;

    if (isNaN(categoryId)) {
      throw new AppError("Invalid category ID", StatusCodes.BAD_REQUEST);
    }

    const category = await categoryService.getCategoryByIdAndUser(
      categoryId,
      userId
    );
    if (!category) {
      throw new AppError("Category not found", StatusCodes.NOT_FOUND);
    }

    // check if they already have another category named as incoming name to prevent duplicates
    if (name && name !== category.name) {
      const existingCategory = await categoryService.getCategoryByNameAndUser(
        name,
        userId
      );
      if (existingCategory) {
        throw new AppError(
          "Category with this name already exists",
          StatusCodes.CONFLICT
        );
      }
    }

    const updatedCategory = await categoryService.updateCategory(category, {
      name,
    });

    sendResponse(res, StatusCodes.OK, {
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const categoryId = parseInt(req.params.id as string, 10);

    if (isNaN(categoryId)) {
      throw new AppError("Invalid category ID", StatusCodes.BAD_REQUEST);
    }

    const category = await categoryService.getCategoryByIdAndUser(
      categoryId,
      userId
    );
    if (!category) {
      throw new AppError("Category not found", StatusCodes.NOT_FOUND);
    }

    const inUse = await categoryService.isCategoryInUse(category.id);
    if (inUse) {
      throw new AppError(
        "Cannot delete category as it is currently in use by one or more tasks",
        StatusCodes.CONFLICT
      );
    }

    await categoryService.deleteCategory(category.id);

    sendResponse(res, StatusCodes.OK, {
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
