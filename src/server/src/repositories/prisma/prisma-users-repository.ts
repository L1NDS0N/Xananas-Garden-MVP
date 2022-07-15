import { UsersUpdateData, UsersData } from '../users-repository';
import { prisma } from '../../../../lib/prisma';
import { IUsersRepository, UsersCreateData } from '../users-repository';

export class PrismaUsersRepository implements IUsersRepository {
  async create({ name, email, password, username, admin, phone, whatsapp, avatar, googleId }: UsersCreateData) {
    await prisma.user.create({
      data: {
        name,
        email,
        password,
        username,
        admin: admin ?? false,
        phone: phone || null,
        whatsapp: whatsapp || null,
        avatar: avatar || null,
        googleId: googleId || null,
      },
    });
  }

  async findAll() {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        whatsapp: true,
        avatar: true,
        googleId: true,
        admin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users as any as UsersData[];
  }

  async findOne(id: string) {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        whatsapp: true,
        avatar: true,
        googleId: true,
        admin: true,
      },
    });

    return user as UsersData;
  }

  async findOneWithPassword(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user as UsersData | null;
  }

  async findByUsername(username: string) {
    // Try username first, then email
    let user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: username },
      });
    }

    return user as UsersData | null;
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

  async deleteOne(id: string) {
    await prisma.user.delete({ where: { id } });
  }
}
