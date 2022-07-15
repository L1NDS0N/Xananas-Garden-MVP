export interface UsersCreateData {
  name: string;
  username: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  googleId?: string;
  admin?: boolean;
  password: string;
}
export interface UsersUpdateData {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  googleId?: string;
  admin?: boolean;
}

export interface UsersData {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  googleId?: string;
  admin: boolean;
  password?: string;
}

export interface IUsersRepository {
  create: (data: UsersCreateData) => Promise<void>;
  findAll: () => Promise<UsersData[]>;
  findOne: (id: string) => Promise<UsersData>;
  /** Same as findOne, but includes the password hash — only for password verification, never returned to clients. */
  findOneWithPassword: (id: string) => Promise<UsersData | null>;
  findByUsername: (username: string) => Promise<UsersData | null>;
  updateOne: (id: string, data: UsersUpdateData) => Promise<void>;
  updatePassword: (id: string, password: string) => Promise<void>;
  deleteOne: (id: string) => Promise<void>;
}
