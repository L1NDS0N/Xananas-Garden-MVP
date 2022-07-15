import useSWR, { useSWRConfig } from 'swr';
import { SWR_KEYS } from '../lib/swr-config';
import { api } from '../lib/api';

interface Category {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useCategories() {
  const { data, error, isLoading } = useSWR<Category[]>(
    SWR_KEYS.productsCategory,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Categories rarely change
    }
  );

  return {
    categories: data || [],
    isLoading,
    isError: error,
  };
}

export function useCategoryMutations() {
  const { mutate } = useSWRConfig();

  const createCategory = async (data: { name: string }) => {
    const res = await api.post(SWR_KEYS.productsCategory, data);
    await mutate(SWR_KEYS.productsCategory);
    return res.data;
  };

  const updateCategory = async (id: string, data: { name: string }) => {
    const res = await api.put(`${SWR_KEYS.productsCategory}/${id}`, data);
    await mutate(SWR_KEYS.productsCategory);
    return res.data;
  };

  const deleteCategory = async (id: string) => {
    await api.delete(`${SWR_KEYS.productsCategory}/${id}`);
    await mutate(SWR_KEYS.productsCategory);
  };

  return { createCategory, updateCategory, deleteCategory };
}
