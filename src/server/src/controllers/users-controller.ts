import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaUsersRepository } from '../repositories/prisma/prisma-users-repository';
import { UsersUpdateData } from '../repositories/users-repository';
import { UsersService } from '../services/users-service';
import { UsersCreateData } from './../repositories/users-repository';

export class UsersController {
  async postUser(request: NextApiRequest, response: NextApiResponse) {
    const { body: data } = request as { body: UsersCreateData };

    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);

    await usersService.createUser(data);

    return response.status(201);
  }

  async getUser(request: NextApiRequest, response: NextApiResponse) {
    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);
    const { id } = request.query as { id: string };

    try {
      const user = await usersService.findOne(id);
      return response.status(200).json(user);
    } catch (error) {
      return response.status(500).send(error);
    }
  }

  async putUser(request: NextApiRequest, response: NextApiResponse) {
    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);

    const { id } = request.query as { id: string };
    const { body: data } = request as { body: UsersUpdateData };

    try {
      const user = await usersService.updateOne(id, data);

      return response.status(200).json(user);
    } catch (error) {
      return response.status(500).send(error);
    }
  }
}
