import bcrypt from 'bcrypt';
import {
  UsersCreateData,
  UsersData,
  UsersUpdateData,
} from '../repositories/users-repository';
import { IUsersRepository } from '../repositories/users-repository';

export interface IUsersService {
  createUser: (data: UsersCreateData) => Promise<void>;
  findOne: (id: string) => Promise<UsersData>;
  updateOne: (id: string, data: UsersUpdateData) => Promise<void>;
}

export class UsersService implements IUsersService {
  constructor(private usersRepository: IUsersRepository) {}

  async createUser(data: UsersCreateData) {
    const { password } = data;
    if (!password) throw new Error('Password is required');

    const hash = await bcrypt.hash(password, 10);

    return await this.usersRepository.create({ ...data, password: hash });
  }

  async findOne(id: string) {
    return await this.usersRepository.findOne(id);
  }

  async updateOne(id: string, data: UsersUpdateData) {
    return await this.usersRepository.updateOne(id, data);
  }
}
