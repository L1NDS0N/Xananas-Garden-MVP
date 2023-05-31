export interface IUsersCreateData {
	name: string;
	username: string;
	email: string;
	admin?: boolean;
	password: string;
}
export interface IUsersUpdateData {
	name?: string;
	username?: string;
	email?: string;
	admin?: boolean;
}

export interface IUsersData {
	id: string;
	name: string;
	username: string;
	userSecret: string;
	email: string;
	admin: boolean;
}
export interface IUserAuthData {
	id: string;
	name: string;
	username: string;
	password: string;
	userSecret: string;
	email: string;
	admin: boolean;
}

export interface IUsersRepository {
	create: (data: IUsersCreateData) => Promise<void>;
	findOne: (id: string) => Promise<IUsersData>;
	findByEmail: (email: string) => Promise<IUsersData>;
	findByUsername: (username: string) => Promise<IUsersData>;
	findByEmailOrUsername: (emailOrUsername: string) => Promise<IUserAuthData>;
	updateOne: (
		id: string,
		data: IUsersUpdateData
	) => Promise<Partial<IUserAuthData>>;
	updatePassword: (id: string, password: string) => Promise<boolean>;
	hasUsers: () => Promise<boolean>;
	deleteOne: (id: string) => Promise<boolean>;
}
