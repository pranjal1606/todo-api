import { db } from "../../config/database.js";
import { User } from "../../auth/entities/User.js";

const userRepository = db.getRepository(User);

export const findUser = async (criteria: { id?: number; email?: string }) => {
  try {
    return await userRepository.findOne({
      where: criteria,
    });
  } catch (error) {
    throw error;
  }
};

export const saveUserRecord = async (user: Partial<User>) => {
  try {
    return await userRepository.save(user);
  } catch (error) {
    throw error;
  }
};
