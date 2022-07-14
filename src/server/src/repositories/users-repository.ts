export interface UsersCreateData {
  name: string;
  username: string;
  email: string;
  admin?: boolean;
  password: string;
}
export interface UsersUpdateData {
  name?: string;
  username?: string;
  email?: string;
  admin?: boolean;
}

export interface UsersData {
  id: string;
  name: string;
  username: string;
  email: string;
  admin: boolean;
}

export interface IUsersRepository {
  create: (data: UsersCreateData) => Promise<void>;
  findOne: (id: string) => Promise<UsersData>;
  updateOne: (id: string, data: UsersUpdateData) => Promise<void>;
  updatePassword: (id: string, password: string) => Promise<void>;
}
