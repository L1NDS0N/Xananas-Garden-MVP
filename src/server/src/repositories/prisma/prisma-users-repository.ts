import { UsersUpdateData, UsersData } from '../users-repository';
import { prisma } from '../../../../lib/prisma';
import { IUsersRepository, UsersCreateData } from '../users-repository';

export class PrismaUsersRepository implements IUsersRepository {
  async create({ name, email, password, username }: UsersCreateData) {
    await prisma.user.create({
      data: {
        name,
        email,
        password,
        username,
      },
    });
  }

  async findOne(id: string) {
    const user = (await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        admin: true,
      },
    })) as UsersData;
    
    return user;
  }

  async updateOne(id: string, data: UsersUpdateData) {
    await prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  async updatePassword(id: string, password: string) {
    await prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
      },
    });
  }
}
