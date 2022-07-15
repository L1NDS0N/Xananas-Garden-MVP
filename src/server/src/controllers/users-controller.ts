import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaUsersRepository } from '../repositories/prisma/prisma-users-repository';
import { UsersUpdateData } from '../repositories/users-repository';
import { UsersService } from '../services/users-service';
import { UsersCreateData } from './../repositories/users-repository';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { auditLog, diffChanges } from '../../../lib/audit';
import { getUserFromRequest } from '../../../lib/apiAuth';

const JWT_SECRET = process.env.JWT_SECRET || 'xananas-garden-secret';

export class UsersController {
  async postUser(request: NextApiRequest, response: NextApiResponse) {
    const { body: data } = request as { body: UsersCreateData };

    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);

    try {
      await usersService.createUser(data);

      const created = await usersService.findByUsername(data.username);
      const actingUser = getUserFromRequest(request);
      const { password: _password, ...dataWithoutPassword } = data;
      await auditLog({
        action: 'create',
        entity: 'user',
        entityId: created?.id,
        changes: diffChanges({}, dataWithoutPassword),
        userId: actingUser?.id,
        userName: actingUser?.name,
      });

      return response.status(201).json({ message: 'User created' });
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async postLogin(request: NextApiRequest, response: NextApiResponse) {
    const { username, password } = request.body;

    if (!username || !password) {
      return response.status(400).json({ error: 'Username and password are required' });
    }

    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);

    try {
      const user = await usersService.findByUsername(username);
      if (!user) {
        return response.status(401).json({ error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.password || '');
      if (!valid) {
        return response.status(401).json({ error: 'Invalid credentials' });
      }

      const role = (user as any).role || (user.admin ? 'admin' : 'viewer');

      const token = jwt.sign(
        { id: user.id, username: user.username, admin: user.admin, role, phone: user.phone, whatsapp: user.whatsapp, avatar: user.avatar },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return response.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          whatsapp: user.whatsapp,
          avatar: user.avatar,
          admin: user.admin,
          role,
        },
      });
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getUser(request: NextApiRequest, response: NextApiResponse) {
    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);
    const id = request.query.id as string;

    try {
      const user = await usersService.findOne(id);
      return response.status(200).json(user);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getUsers(request: NextApiRequest, response: NextApiResponse) {
    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);

    try {
      const users = await usersService.findAll();
      return response.status(200).json(users);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async putUser(request: NextApiRequest, response: NextApiResponse) {
    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);

    const id = request.query.id as string;
    const { body: data } = request as { body: UsersUpdateData };

    try {
      const oldUser = await usersService.findOne(id);
      const user = await usersService.updateOne(id, data);

      const actingUser = getUserFromRequest(request);
      await auditLog({
        action: 'update',
        entity: 'user',
        entityId: id,
        changes: diffChanges(oldUser || {}, data),
        userId: actingUser?.id,
        userName: actingUser?.name,
      });

      return response.status(200).json(user);
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async putPassword(request: NextApiRequest, response: NextApiResponse) {
    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);

    const id = request.query.id as string;
    const { currentPassword, newPassword } = request.body as { currentPassword?: string; newPassword?: string };

    const actingUser = getUserFromRequest(request);
    if (!actingUser) return response.status(401).json({ error: 'Não autenticado' });

    const isSelf = actingUser.id === id;
    const isAdmin = actingUser.role === 'admin' || actingUser.admin;
    if (!isSelf && !isAdmin) {
      return response.status(403).json({ error: 'Permissão insuficiente' });
    }

    try {
      if (isSelf) {
        await usersService.changePassword(id, currentPassword || '', newPassword || '');
      } else {
        // Admin resetting another user's password — no current-password check.
        await usersService.resetPassword(id, newPassword || '');
      }

      await auditLog({
        action: 'update',
        entity: 'user',
        entityId: id,
        changes: { password: { from: '••••••', to: '••••••' } },
        userId: actingUser.id,
        userName: actingUser.name,
      });

      return response.status(200).json({ message: 'Senha atualizada' });
    } catch (error: any) {
      return response.status(400).json({ error: error.message || 'Erro ao atualizar senha' });
    }
  }

  async deleteUser(request: NextApiRequest, response: NextApiResponse) {
    const usersRepository = new PrismaUsersRepository();
    const usersService = new UsersService(usersRepository);
    const id = request.query.id as string;

    try {
      const oldUser = await usersService.findOne(id);
      await usersService.deleteOne(id);

      const actingUser = getUserFromRequest(request);
      const { password: _password, ...oldUserWithoutPassword } = (oldUser || {}) as any;
      await auditLog({
        action: 'delete',
        entity: 'user',
        entityId: id,
        changes: diffChanges(oldUserWithoutPassword, {}),
        userId: actingUser?.id,
        userName: actingUser?.name,
      });

      return response.status(200).json({ message: 'User deleted' });
    } catch (error: any) {
      return response.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}
