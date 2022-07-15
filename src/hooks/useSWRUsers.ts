import useSWR, { useSWRConfig } from 'swr';
import { SWR_KEYS } from '../lib/swr-config';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  avatar?: string;
  admin: boolean;
  createdAt: string;
}

export function useUsers() {
  const { data, error, isLoading } = useSWR<User[]>(
    SWR_KEYS.users,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  return {
    users: data || [],
    isLoading,
    isError: error,
  };
}

export function useUserMutations() {
  const { mutate } = useSWRConfig();

  const createUser = async (data: { name: string; username: string; email: string; password: string; phone?: string; whatsapp?: string; admin: boolean }) => {
    await api.post(SWR_KEYS.users, data);
    await mutate(SWR_KEYS.users);
  };

  const updateUser = async (id: string, data: Partial<User & { password?: string; updatePassword?: boolean }>) => {
    await api.put(`${SWR_KEYS.users}/${id}`, data);
    await mutate(SWR_KEYS.users);
  };

  const deleteUser = async (id: string) => {
    await api.delete(`${SWR_KEYS.users}/${id}`);
    await mutate(SWR_KEYS.users);
  };

  return { createUser, updateUser, deleteUser };
}
