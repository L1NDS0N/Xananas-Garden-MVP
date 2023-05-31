import { Server } from 'http';
import request from 'supertest';
import {
	createClientServer,
	getApiRoutesDirHandler,
} from '../../helpers/api-client-create-helper';
import { APP_RULES } from '@/server/references/app-rules';

type TUserCredentials = {
	token: string;
	user: {
		id: string;
		name: string;
		username: string;
		email: string;
		admin: boolean;
	};
};
type TUserLogin = {
	email: string;
	password: string;
};
describe('Api tests suite for user crud', () => {
	const { _exceptions, _email, _password, _username } = APP_RULES.user;

	let adminUserCredentials: TUserCredentials;
	let commonUserCredentials: TUserCredentials;
	let adminUserLogin: TUserLogin;
	let commonUserLogin: TUserLogin;
	let client: request.SuperTest<request.Test>;
	let server: Server;

	beforeAll(() => {
		const { _client, _server } = createClientServer(
			getApiRoutesDirHandler('/admin/user')
		);
		server = _server;
		client = _client;
	});

	afterAll(done => {
		if (server) {
			server.close(() => {
				done();
			});
		}
		done();
	});

	it('Should create user without a token on first user table record', async () => {
		const userToBeCreated = {
			first_user: true,
			name: 'Lindson França',
			username: 'testador',
			email: 'lindson@gmail.com',
			password: 'Password@123',
		};
		adminUserLogin = {
			email: userToBeCreated.email,
			password: userToBeCreated.password,
		};

		const response = await client.post('/').send(userToBeCreated);

		if (response.status === 400) {
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: 'Esta funcionalidade já está obsoleta',
			});
		} else {
			expect(response.status).toBe(201);
		}
	});

	it('Should login admin credentials', async () => {
		const { _client, _server } = createClientServer(
			getApiRoutesDirHandler('/admin/auth')
		);
		async function login(aUserLogin: TUserLogin) {
			const response = await _client.post('/').send(aUserLogin);

			expect(response.status).toBe(200);
			expect(response.body.user.userSecret).not.toBeDefined();
			expect(response.body.user.password).not.toBeDefined();
			expect(response.body).toEqual(
				expect.objectContaining({
					token: expect.anything(),
					user: expect.objectContaining({
						id: expect.anything(),
						name: expect.anything(),
						username: expect.anything(),
						email: expect.anything(),
						admin: expect.anything(),
					}),
				})
			);
			adminUserCredentials = response.body as TUserCredentials;
		}
		await login(adminUserLogin);
		_server.close(() => {
			client.checkout('/admin/auth');
		});
	});

	it('Should create an user only using an admin credential', async () => {
		const userToBeCreated = {
			name: 'Tester user',
			username: 'tester',
			email: 'testing@gmail.com',
			password: 'Test_pass@123',
		};
		const response = await client
			.post('/')
			.send(userToBeCreated)
			.set('Authorization', `Bearer ${adminUserCredentials.token}`);
		if (response.status === 400) {
			expect(response.status).toBe(400);
			expect(response.body).toEqual({
				error: 'Erro ao criar usuário. Usuário já existe',
			});
		} else {
			expect(response.status).toBe(201);
		}
	});

	it('Should login with the recently common user created', async () => {
		const { _client, _server } = createClientServer(
			getApiRoutesDirHandler('/admin/auth')
		);
		async function login(aUserLogin: TUserLogin) {
			const response = await _client.post('/').send(aUserLogin);

			expect(response.status).toBe(200);
			expect(response.body.user.userSecret).not.toBeDefined();
			expect(response.body.user.password).not.toBeDefined();
			expect(response.body).toEqual(
				expect.objectContaining({
					token: expect.anything(),
					user: expect.objectContaining({
						id: expect.anything(),
						name: expect.anything(),
						username: expect.anything(),
						email: expect.anything(),
						admin: expect.anything(),
					}),
				})
			);
			commonUserCredentials = response.body as TUserCredentials;
		}
		commonUserLogin = {
			email: 'testing@gmail.com',
			password: 'Test_pass@123',
		};
		await login(commonUserLogin);
		_server.close(() => {
			client.checkout('/admin/auth');
		});
	});

	it('Should update the user recently created only with common user credentials', async () => {
		const userToUpdate = {
			id: commonUserCredentials.user.id,
			name: 'Tester user updated',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(
			expect.objectContaining({
				user: expect.objectContaining({
					id: expect.stringMatching(commonUserCredentials.user.id),
					name: expect.stringMatching(userToUpdate.name),
					username: expect.anything(),
					email: expect.anything(),
					admin: expect.anything(),
				}),
			})
		);
	});

	it('Should not update with an username that already exists', async () => {
		const userToUpdate = {
			username: 'tester',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error:
				_exceptions.default.context.update.message +
				_exceptions.case.trying_to_use_an_username_that_already_exists.message,
		});
	});

	it('Should not update with an email that already exists', async () => {
		const userToUpdate = {
			email: 'testing@gmail.com',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error:
				_exceptions.default.context.update.message +
				_exceptions.case.trying_to_use_an_email_that_already_exists.message,
		});
	});

	it('Should not update with an email with wrong email format', async () => {
		const userToUpdate = {
			email: 'testing@com',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error:
				_exceptions.default.context.update.message + _email.validation.message,
		});
	});

	it('Should not be able to update username with a wrong format', async () => {
		const userToUpdate = {
			username: '(*& &!&user',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error:
				_exceptions.default.context.update.message + _username.regex.message,
		});
	});

	it('Should not be able to update password with a password without the mininum size of characteres', async () => {
		const userToUpdate = {
			password: '123',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: _exceptions.default.context.update.message + _password.min.message,
		});
	});
	
	it('Should not be able to update password with a password without the secure password pattern (without numbers)', async () => {
		const userToUpdate = {
			password: 'Passwordd',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error:
				_exceptions.default.context.update.message +
				_password.regex._3rd.message,
		});
	});

	it('Should not be able to update password with a password without the secure password pattern (without special symbols)', async () => {
		const userToUpdate = {
			password: 'Password1',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error:
				_exceptions.default.context.update.message +
				_password.regex._4th.message,
		});
	});

	it('Should not be able to update password with a weak password format (only lowercase chars)', async () => {
		const userToUpdate = {
			password: 'password123',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error:
				_exceptions.default.context.update.message +
				_password.regex._2nd.message,
		});
	});

	it('Should not be able to update password with a weak password format (only UPPERCASE chars)', async () => {
		const userToUpdate = {
			password: 'PASSWORD123',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error:
				_exceptions.default.context.update.message +
				_password.regex._1st.message,
		});
	});

	it('Should update username and email properly', async () => {
		const userToUpdate = {
			username: 'Tester_2022',
			email: 'testing_2022@gmail.com',
		};
		const response = await client
			.put('/')
			.send(userToUpdate)
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		if (response.status === 400) {
			expect(response.body).toEqual({
				error:
					_exceptions.default.context.update.message +
					_exceptions.case.trying_to_use_an_email_that_already_exists.message,
			});
		} else {
			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				expect.objectContaining({
					user: expect.objectContaining({
						id: expect.anything(),
						name: expect.anything(),
						username: expect.stringMatching(userToUpdate.username),
						email: expect.stringMatching(userToUpdate.email),
						admin: expect.anything(),
					}),
				})
			);
		}
	});

	it('Should delete common user properly', async () => {
		const response = await client
			.delete('/')
			.set('Authorization', `Bearer ${commonUserCredentials.token}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(_exceptions.default.context.delete.success);
	});
});
