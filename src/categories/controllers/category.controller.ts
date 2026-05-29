import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as categoryService from "../services/category.service.js";
import { AppError } from "../../commons/AppError.js";

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
    res.status(StatusCodes.CREATED).json({
      status: "success",
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

    res.status(StatusCodes.OK).json({
      status: "success",
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

    res.status(StatusCodes.OK).json({
      status: "success",
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

    await categoryService.deleteCategory(category.id);

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
