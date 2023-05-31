import Prisma from '@/server/lib/prisma/client';
import {
	IUserAuthData,
	IUsersCreateData,
	IUsersData,
	IUsersRepository,
	IUsersUpdateData,
} from '../../interfaces/users-repository-intf';

export class PrismaUsersRepository implements IUsersRepository {
	async create({ name, email, password, username, admin }: IUsersCreateData) {
		username = username.toLocaleLowerCase();
		email = email.toLocaleLowerCase();
		await Prisma.new().user.create({
			data: {
				name,
				email,
				password,
				username,
				admin,
			},
		});
	}

	async hasUsers(): Promise<boolean> {
		const usersLength = await Prisma.new().user.count();

		return usersLength > 0;
	}

	async findOne(id: string) {
		const user = (await Prisma.new().user.findUnique({
			where: {
				id,
			},
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				userSecret: true,
				admin: true,
			},
		})) as IUsersData;

		return user;
	}

	async findByEmail(email: string) {
		const user = (await Prisma.new().user.findUnique({
			where: {
				email,
			},
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				admin: true,
			},
		})) as IUsersData;

		return user;
	}
	async findByUsername(username: string) {
		const user = (await Prisma.new().user.findUnique({
			where: {
				username,
			},
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				admin: true,
			},
		})) as IUsersData;

		return user;
	}

	async findByEmailOrUsername(emailOrUsername: string) {
		emailOrUsername = emailOrUsername.toLocaleLowerCase();
		const user = (await Prisma.new().user.findFirst({
			where: {
				OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
			},
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				admin: true,
				password: true,
			},
		})) as IUserAuthData;

		return user;
	}

	async updateOne(
		id: string,
		data: IUsersUpdateData
	): Promise<Partial<IUserAuthData>> {
		const dataUpdated = await Prisma.new().user.update({
			select: {
				id: true,
				name: true,
				email: true,
				username: true,
				admin: true,
			},
			where: {
				id: id,
			},
			data: data,
		});

		return dataUpdated;
	}

	async updatePassword(id: string, password: string) {
		try {
			await Prisma.new().user.update({
				where: {
					id,
				},
				data: {
					password,
				},
			});
			return true;
		} catch (error) {
			return false;
		}
	}

	async deleteOne(id: string): Promise<boolean> {
		try {
			await Prisma.new().user.delete({ where: { id } });
			return true;
		} catch (error) {
			return false;
		}
	}
}
