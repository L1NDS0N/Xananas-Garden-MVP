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
describe('Api tests suite for authentication', () => {
	const { _exceptions } = APP_RULES.user;

	let client: request.SuperTest<request.Test>;
	let server: Server;
	let adminUserCredentials: TUserCredentials;

	beforeAll(() => {
		const { _client, _server } = createClientServer(
			getApiRoutesDirHandler('/admin/auth')
		);
		server = _server;
		client = _client;
	});

	afterAll(done => {
		client.checkout('/admin/auth');
		server.close(err => {
			done(err?.message);
		});
	});

	it('Should not login without user credentials', async () => {
		const response = await client.post('/');
		expect(response.status).toBe(400);
		expect(response.body).not.toHaveProperty('user');
		expect(response.body).not.toHaveProperty('token');
		expect(response.body).toEqual({ error: 'E-mail e senha são obrigatórios' });
	});

	it('Should not login without password', async () => {
		const response = await client.post('/').send({ email: 'testador' });

		expect(response.status).toBe(400);
		expect(response.body).not.toHaveProperty('user');
		expect(response.body).not.toHaveProperty('token');
		expect(response.body).toEqual({ error: 'E-mail e senha são obrigatórios' });
	});

	it('Should not login without email', async () => {
		const response = await client.post('/').send({ password: 'password' });

		expect(response.status).toBe(400);
		expect(response.body).not.toHaveProperty('user');
		expect(response.body).not.toHaveProperty('token');
		expect(response.body).toEqual({ error: 'E-mail e senha são obrigatórios' });
	});

	it('Should not login properly', async () => {
		const response = await client
			.post('/')
			.send({ email: 'wrong_email@gmail.com', password: 'wrong_pass' });

		expect(response.status).toBe(401);
		expect(response.body).not.toHaveProperty('user');
		expect(response.body).not.toHaveProperty('token');
		expect(response.body).toEqual({ error: 'E-mail ou senha inválidos' });
	});

	it('Should login succefully using its email', async () => {
		const response = await client
			.post('/')
			.send({ email: 'lindson@gmail.com', password: 'Password@123' });

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
	});

	it('Should login succefully using its username as email', async () => {
		const response = await client
			.post('/')
			.send({ email: 'testador', password: 'Password@123' });

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
	});

	it('Should login succefully using its email in case insensitive format', async () => {
		const response = await client
			.post('/')
			.send({ email: 'LiNdSoN@gMaIl.CoM', password: 'Password@123' });

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
		adminUserCredentials = response.body;
	});

});
