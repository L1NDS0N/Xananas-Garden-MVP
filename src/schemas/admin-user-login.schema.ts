import z from "zod";

export const adminUserLoginSchema = z.object({
  username: z
    .string()
    .min(8, "O apelido de usuário precisa de pelo menos 8 caracteres")
    .max(
      40,
      "O apelido ou e-mail de usuário não pode ter mais do que 40 caracteres"
    )
    .nonempty("O campo de usuário é obrigatório"),
  password: z
    .string()
    .min(8, "A senha precisa de no mínimo 6 caracteres")
    .max(24, "A senha só pode ter no máximo 24 caracteres")
    .nonempty("O campo de senha é obrigatório"),
});

export type TLoginUserAdmin = z.infer<typeof adminUserLoginSchema>;
