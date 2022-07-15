import { SWRConfiguration } from 'swr';
import { api } from './api';

// Generic fetcher for SWR
export const fetcher = (url: string) =>
  api.get(url).then(res => res.data);

// Default SWR configuration
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,   // Dedupe identical requests within 5s
  errorRetryCount: 3,
  errorRetryInterval: 2000,
  focusThrottleInterval: 5000,
};

// Cache keys
export const SWR_KEYS = {
  products: '/products',
  productsCategory: '/products-category',
  users: '/users',
  sales: '/sales',
  salesSummary: '/sales/summary',
  productBySlug: (slug: string) => `/products/slug/${slug}`,
} as const;
