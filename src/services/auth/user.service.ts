import { db } from "../../config/database.js";
import { User } from "../../entities/User.js";

const userRepository = db.getRepository(User);

export const findUserByEmail = async (email: string) => {
  return await userRepository.findOne({
    where: { email },
  });
};

export const findUserById = async (id: number) => {
  return await userRepository.findOne({
    where: { id },
  });
};

export const createUserRecord = async (user: Partial<User>) => {
  const newUser = userRepository.create(user);
  return await userRepository.save(newUser);
};

export const updateUserRecord = async (user: User) => {
  return await userRepository.save(user);
};
