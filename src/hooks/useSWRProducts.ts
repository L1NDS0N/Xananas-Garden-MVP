import useSWR, { useSWRConfig } from 'swr';
import { SWR_KEYS } from '../lib/swr-config';
import { api } from '../lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceNegotiable?: boolean;
  note?: string | null;
  amount: number;
  published: boolean;
  videoUrl?: string | null;
  videoPosition?: number;
  tags?: string | null;
  categoryId: string;
  category: { id: string; name: string };
  /** All categories the product belongs to — primary category plus any additional ones */
  categories?: { id: string; name: string }[];
  images: { id: string; image: string;  order?: number }[];
  createdBy?: { id: string; name: string; avatar?: string | null; whatsapp?: string | null; phone?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

// Fetch all products
export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    SWR_KEYS.products,
    {
      revalidateOnFocus: false, // Products rarely change
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30s dedup
    }
  );

  return {
    products: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Fetch single product by slug
export function useProductBySlug(slug: string | undefined) {
  const { data, error, isLoading } = useSWR<Product>(
    slug ? SWR_KEYS.productBySlug(slug) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1min dedup for individual products
    }
  );

  return {
    product: data || null,
    isLoading,
    isError: error,
  };
}

// Product mutations (create, update, delete)
export function useProductMutations() {
  const { mutate } = useSWRConfig();

  const createProduct = async (formData: FormData) => {
    const res = await api.post(SWR_KEYS.products, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await mutate(SWR_KEYS.products);
    return res.data;
  };

  const updateProduct = async (id: string, formData: FormData) => {
    const res = await api.put(`${SWR_KEYS.products}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await mutate(SWR_KEYS.products);
    return res.data;
  };

  const deleteProduct = async (id: string) => {
    await api.delete(`${SWR_KEYS.products}/${id}`);
    await mutate(SWR_KEYS.products);
  };

  const reorderImages = async (productId: string, imageOrders: { id: string; order: number }[], videoPosition: number) => {
    await api.patch(`${SWR_KEYS.products}/${productId}`, { imageOrders, videoPosition });
    await mutate(SWR_KEYS.products);
  };

  return { createProduct, updateProduct, deleteProduct, reorderImages };
}
