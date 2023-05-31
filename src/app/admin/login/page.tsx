"use client";
import Head from "next/head";

import { apiV1 } from "@/app/lib/axios";
import { XButton } from "@/components/XButton";
import { XToastContext } from "@/contexts/XToastContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import Logo from "../../../assets/Logo";

const loginAdminUserSchema = z.object({
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
type TLoginUserAdmin = z.infer<typeof loginAdminUserSchema>;

export default function Login() {
  const { showXToast } = useContext(XToastContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginUserAdmin>({
    resolver: zodResolver(loginAdminUserSchema),
  });
  async function handleLogin(data: TLoginUserAdmin) {
    await apiV1
      .post<any>("/admin/auth", {
        email: data.username,
        password: data.password,
      })
      .then((res) => {
        sessionStorage.setItem("@xg:user", JSON.stringify(res.data));
      })
      .catch((err) => {
        showXToast({
          description: err.data.message,
          title: "Erro no login",
        });
      });
  }
  return (
    <>
      <Head>
        <title>Login - Autentique-se no sistema</title>
      </Head>

      <main className="flex h-screen flex-col items-center justify-center bg-zinc-100">
        <section className="min-h-80 flex max-h-96 w-[26rem] flex-1 rounded-lg bg-white shadow-sm">
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6">
            <div className="my-2 h-24">
              <Logo width={100} height={100} />
            </div>

            <form
              onSubmit={handleSubmit(handleLogin)}
              className="flex w-full flex-col gap-2"
            >
              <input
                {...register("username")}
                autoFocus
                type="text"
                placeholder="Usuário"
                className="h-10 rounded border border-zinc-200 p-2"
              />
              {errors.username && (
                <span className="text-sm text-red-400">
                  {errors.username.message}
                </span>
              )}
              <input
                {...register("password")}
                type="password"
                placeholder="Senha"
                className="h-10 rounded border border-zinc-200 p-2"
              />
              {errors.password && (
                <span className="text-sm text-red-400">
                  {errors.password.message}
                </span>
              )}
              <XButton xType="Primary" xTitle="Entrar" type="submit" />
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
