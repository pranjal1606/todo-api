import { db } from "../config/database.js";
import { Category } from "./entities/Category.js";

const categoryRepository = db.getRepository(Category);

export const createCategory = async (userId: number, name: string) => {
  try {
    return await categoryRepository.save({
      name,
      user: { id: userId },
    });
  } catch (error) {
    throw error;
  }
};

export const getCategoryByNameAndUser = async (
  name: string,
  userId: number
) => {
  try {
    return await categoryRepository.findOne({
      where: { name, user: { id: userId } },
    });
  } catch (error) {
    throw error;
  }
};

export const getCategoriesByUser = async (userId: number) => {
  try {
    return await categoryRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });
  } catch (error) {
    throw error;
  }
};

export const getCategoryByIdAndUser = async (
  categoryId: number,
  userId: number
) => {
  try {
    return await categoryRepository.findOne({
      where: { id: categoryId, user: { id: userId } },
    });
  } catch (error) {
    throw error;
  }
};

export const updateCategory = async (
  category: Category,
  updateData: { name: string }
) => {
  try {
    category.name = updateData.name;
    return await categoryRepository.save(category);
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (categoryId: number) => {
  try {
    await categoryRepository.softDelete(categoryId);
  } catch (error) {
    throw error;
  }
};
