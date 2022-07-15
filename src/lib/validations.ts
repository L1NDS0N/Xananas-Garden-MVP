import { z } from 'zod';

// Product validation
export const productSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
  price: z
    .number()
    .min(0, 'Preço não pode ser negativo')
    .max(99999, 'Preço muito alto'),
  priceNegotiable: z.boolean().default(false),
  note: z.string().max(500, 'Observações devem ter no máximo 500 caracteres').optional().nullable(),
  amount: z
    .number()
    .int('Quantidade deve ser um número inteiro')
    .min(0, 'Quantidade não pode ser negativa')
    .max(99999, 'Quantidade muito alta'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  categoryIds: z.array(z.string()).optional(),
  paymentMethodIds: z.array(z.string()).optional(),
  published: z.boolean().default(true),
  slug: z.string().max(200, 'Slug deve ter no máximo 200 caracteres').optional().nullable(),
  videoUrl: z.string().url('URL inválida').optional().nullable(),
  tags: z.string().max(300, 'Tags devem ter no máximo 300 caracteres').optional().nullable(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Category validation
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ú\s]+$/, 'Nome deve conter apenas letras'),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// User validation
export const userSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  username: z
    .string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscores'),
  email: z
    .string()
    .email('Email inválido'),
  password: z.string().optional().or(z.literal('')),
  phone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional().nullable(),
  whatsapp: z.string().max(20, 'WhatsApp deve ter no máximo 20 caracteres').optional().nullable(),
  admin: z.boolean().default(false),
  role: z.enum(['admin', 'manager', 'cashier', 'viewer']).default('admin'),
});

export type UserFormData = z.infer<typeof userSchema>;

// Login validation
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username é obrigatório'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Product filters validation
export const productFiltersSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'name', 'newest']).optional(),
});

export type ProductFiltersData = z.infer<typeof productFiltersSchema>;

// Chat message validation
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Mensagem não pode estar vazia')
    .max(500, 'Mensagem deve ter no máximo 500 caracteres'),
});

export type ChatMessageData = z.infer<typeof chatMessageSchema>;
