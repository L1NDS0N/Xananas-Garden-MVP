import z from "zod";

export const productCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().nonempty("O campo nome é obrigatório"),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type TProductCategory = z.infer<typeof productCategorySchema>;
