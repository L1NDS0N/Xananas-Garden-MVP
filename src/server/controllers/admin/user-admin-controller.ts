import { NextApiRouter } from '@/server/core/NextApiRouter';
import { hashPassword } from '@/server/helpers/hashPassword';
import { sanitizeObject } from '@/server/helpers/sanitizeObject';
import { whoAmI } from '@/server/helpers/whoami';
import { authenticateAdminMiddleware } from '@/server/middlewares/authenticate-middleware';
import { hashPasswordMiddleware } from '@/server/middlewares/hash-password-middleware';
import { TUserCredentialsJwtSignature } from '@/server/models/User';
import { APP_RULES } from '@/server/references/app-rules';
import { PrismaUsersRepository } from '@/server/repositories/implementation/prisma/users-repository-impl';
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

export class UserAdminController {
	router: NextApiRouter;
	constructor(_router: NextApiRouter) {
		this.router = _router;
	}
	handler() {
		return this.router.handle();
	}

	async create() {
		const { _exceptions, _email, _name, _password, _username } = APP_RULES.user;
		const schema = z.object({
			name: z
				.string()
				.min(_name.min.val, _name.min.message)
				.nonempty(_name.notEmpty.message),
			email: z
				.string()
				.email(_email.validation.message)
				.nonempty(_email.notEmpty.message),
			username: z
				.string()
				.regex(_username.regex.val, _username.regex.message)
				.nonempty(_username.notEmpty.message),
			password: z
				.string()
				.min(_password.min.val, _password.min.message)
				.max(_password.max.val, _password.max.message)
				.nonempty(_password.notEmpty.message)
				.refine(_password.regex._1st.check, _password.regex._1st.message)
				.refine(_password.regex._2nd.check, _password.regex._2nd.message)
				.refine(_password.regex._3rd.check, _password.regex._3rd.message)
				.refine(_password.regex._4th.check, _password.regex._4th.message),
		});
		this.router.post(
			async (req: NextApiRequest, res: NextApiResponse) => {
				const { name, username, email, password } = schema.parse(req.body);
				const { hashedPassword } = req.body;
				if (!name || !username || !email || !password) {
					return res
						.status(400)
						.json({ error: 'Nome, apelido, e-mail e senha são obrigatórios' });
				}

				try {
					let admin = false;
					if (req.body && req.body.first_user) {
						admin = true;
					}
					const usersRepository = new PrismaUsersRepository();
					const emailAlreadyExists = await usersRepository.findByEmail(email);
					if (emailAlreadyExists) throw new Error('Usuário já existe');
					const usernameAlreadyExists = await usersRepository.findByUsername(
						username
					);
					if (usernameAlreadyExists) throw new Error('Usuário já existe');

					usersRepository.create({
						name,
						email,
						username,
						password: hashedPassword,
						admin,
					});
					return res.status(201).end();
				} catch (error: any) {
					return res.status(400).json({
						error: _exceptions.default.context.create.message + error.message,
					});
				}
			},
			[authenticateAdminMiddleware, hashPasswordMiddleware]
		);
	}

	async update() {
		const { _password, _name, _email, _username, _exceptions } = APP_RULES.user;
		const schema = z.object({
			id: z.string().optional(),
			name: z.string().min(_name.min.val, _name.min.message).optional(),
			email: z.string().email(_email.validation.message).optional(),
			username: z
				.string()
				.regex(_username.regex.val, _username.regex.message)
				.optional(),
			password: z
				.string()
				.min(_password.min.val, _password.min.message)
				.max(_password.max.val, _password.max.message)
				.refine(_password.regex._1st.check, _password.regex._1st.message)
				.refine(_password.regex._2nd.check, _password.regex._2nd.message)
				.refine(_password.regex._3rd.check, _password.regex._3rd.message)
				.refine(_password.regex._4th.check, _password.regex._4th.message)
				.optional(),
		});
		this.router.put(
			async (req: NextApiRequest, res: NextApiResponse) => {
				try {
					const { id, name, email, username, password } = schema.parse(
						req.body
					);

					const jwtSecret = process.env.JWT_SECRET as string;
					const userCredentials = whoAmI<TUserCredentialsJwtSignature>(
						req.headers.authorization!,
						jwtSecret
					);

					if (id && !userCredentials.admin && id !== userCredentials.id) {
						throw new Error(
							_exceptions.case.trying_to_update_another_user_info.message
						);
					}
					const usersRepository = new PrismaUsersRepository();
					const idForUpdate = id ?? userCredentials.id;

					if (email) {
						const user = await usersRepository.findByEmail(email);
						if (user) {
							throw new Error(
								_exceptions.case.trying_to_use_an_email_that_already_exists.message
							);
						}
					}
					if (username) {
						const user = await usersRepository.findByUsername(username);
						if (user) {
							throw new Error(
								_exceptions.case.trying_to_use_an_username_that_already_exists.message
							);
						}
					}

					const objSanitized = sanitizeObject({
						name,
						email,
						username,
						password: password ? hashPassword(password) : '',
					});

					const user = await usersRepository.updateOne(
						idForUpdate,
						objSanitized
					);

					return res.status(200).json({
						user: {
							id: user.id,
							name: user.name,
							username: user.username,
							email: user.email,
							admin: user.admin,
						},
					});
				} catch (error: any) {
					if (error instanceof z.ZodError) {
						return res.status(400).json({
							error:
								_exceptions.default.context.update.message +
								error.issues[0].message,
						});
					}
					return res.status(400).json({
						error: _exceptions.default.context.update.message + error.message,
					});
				}
			},
			[authenticateAdminMiddleware]
		);
	}

	async delete() {
		const { _exceptions } = APP_RULES.user;

		this.router.delete(
			async (req: NextApiRequest, res: NextApiResponse) => {
				const { id } = req.body;

				const jwtSecret = process.env.JWT_SECRET as string;
				const userCredentials = whoAmI<TUserCredentialsJwtSignature>(
					req.headers.authorization!,
					jwtSecret
				);

				if (id && !userCredentials.admin && id !== userCredentials.id) {
					throw new Error(
						'Você não pode alterar informações de outro usuário sem ser um administrador do sistema'
					);
				}

				const usersRepository = new PrismaUsersRepository();
				const idForDelete = id ?? userCredentials.id;

				try {
					if (await usersRepository.deleteOne(idForDelete)) {
						return res.json(_exceptions.default.context.delete.success);
					} else {
						throw new Error('Erro durante deleção do usuário');
					}
				} catch (error: any) {
					return res.status(400).json({
						error:
							_exceptions.default.context.delete.error.message + error.message,
					});
				}
			},
			[authenticateAdminMiddleware]
		);
	}
}
