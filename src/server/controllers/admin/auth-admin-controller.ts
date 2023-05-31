import { PrismaUsersRepository } from '@/server/repositories/implementation/prisma/users-repository-impl';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextApiRouter } from '../../core/NextApiRouter';
import { TJwtPayload } from './../../middlewares/authenticate-middleware';

export class AuthAdminController {
	router: NextApiRouter;
	constructor(_router: NextApiRouter) {
		this.router = _router;
	}
	handler() {
		return this.router.handle();
	}

	async login() {
		this.router.post(async (req: NextApiRequest, res: NextApiResponse) => {
			const { email, password } = req.body;

			if (!email || !password) {
				return res
					.status(400)
					.send({ error: 'E-mail e senha são obrigatórios' });
			}

			try {
				const usersRepository = new PrismaUsersRepository();

				const user = await usersRepository.findByEmailOrUsername(email);
				if (!user || !(await bcrypt.compare(password, user.password))) {
					return res.status(401).send({ error: 'E-mail ou senha inválidos' });
				}

				const jwtSecret = process.env.JWT_SECRET as string;
				const token = jwt.sign(
					{ id: user.id, userSecret: user.userSecret, admin: user.admin } as TJwtPayload,
					jwtSecret,
					{
						expiresIn: '8h',
					}
				);

				return res.send({
					token,
					user: {
						id: user.id,
						name: user.name,
						username: user.username,
						email: user.email,
						admin: user.admin,
					},
				});
			} catch (error) {
				console.error('Erro ao fazer login:', error);
				res.status(500).send({ error: 'Erro ao fazer login' });
			}
		});
	}
}
