"use client";

import { XButton } from "@/components/XButton";
import { useAuth } from "@/hooks/useUserAuth";
import {
  TLoginUserAdmin,
  adminUserLoginSchema,
} from "@/schemas/admin-user-login.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Head from "next/head";
import { useForm } from "react-hook-form";
import Logo from "../../../assets/Logo";

export default function Login() {
  const { handleLogin } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginUserAdmin>({
    resolver: zodResolver(adminUserLoginSchema),
  });

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
                placeholder="Nome de usuário ou E-mail"
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
