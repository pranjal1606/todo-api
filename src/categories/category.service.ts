import { db } from "../config/database.js";
import { Category } from "./entities/Category.js";

const categoryRepository = db.getRepository(Category);

export const createCategory = async (userId: number, name: string) => {
  const category = categoryRepository.create({
    name,
    user: { id: userId },
  });
  return await categoryRepository.save(category);
};

export const getCategoryByNameAndUser = async (
  name: string,
  userId: number
) => {
  return await categoryRepository.findOne({
    where: { name, user: { id: userId } },
  });
};

export const getCategoriesByUser = async (userId: number) => {
  return await categoryRepository.find({
    where: { user: { id: userId } },
    order: { createdAt: "DESC" },
  });
};

export const getCategoryByIdAndUser = async (
  categoryId: number,
  userId: number
) => {
  return await categoryRepository.findOne({
    where: { id: categoryId, user: { id: userId } },
  });
};

export const updateCategory = async (
  category: Category,
  updateData: { name: string }
) => {
  category.name = updateData.name;
  return await categoryRepository.save(category);
};

export const deleteCategory = async (categoryId: number) => {
  await categoryRepository.softDelete(categoryId);
};
