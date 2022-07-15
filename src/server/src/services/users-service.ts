import bcrypt from 'bcrypt';
import {
  UsersCreateData,
  UsersData,
  UsersUpdateData,
} from '../repositories/users-repository';
import { IUsersRepository } from '../repositories/users-repository';

export interface IUsersService {
  createUser: (data: UsersCreateData) => Promise<void>;
  findAll: () => Promise<UsersData[]>;
  findOne: (id: string) => Promise<UsersData>;
  findByUsername: (username: string) => Promise<UsersData | null>;
  updateOne: (id: string, data: UsersUpdateData) => Promise<void>;
  changePassword: (id: string, currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (id: string, newPassword: string) => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
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

  async findByUsername(username: string) {
    return await this.usersRepository.findByUsername(username);
  }

  async findAll() {
    return await this.usersRepository.findAll();
  }

  async updateOne(id: string, data: UsersUpdateData) {
    return await this.usersRepository.updateOne(id, data);
  }

  /** Self-service change: requires proving the current password before setting a new one. */
  async changePassword(id: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) throw new Error('A nova senha deve ter ao menos 6 caracteres');

    const user = await this.usersRepository.findOneWithPassword(id);
    if (!user) throw new Error('Usuário não encontrado');

    const valid = await bcrypt.compare(currentPassword || '', user.password || '');
    if (!valid) throw new Error('Senha atual incorreta');

    const hash = await bcrypt.hash(newPassword, 10);
    return await this.usersRepository.updatePassword(id, hash);
  }

  /** Admin-driven reset: no current-password check, used to reset another user's password. */
  async resetPassword(id: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) throw new Error('A nova senha deve ter ao menos 6 caracteres');

    const hash = await bcrypt.hash(newPassword, 10);
    return await this.usersRepository.updatePassword(id, hash);
  }

  async deleteOne(id: string) {
    return await this.usersRepository.deleteOne(id);
  }
}
