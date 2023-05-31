'use client';
import Head from 'next/head';

import { XButton } from '@/components/XButton';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import z from 'zod';
import Logo from '../../../assets/Logo';
import { apiV1 } from '@/app/lib/axios';

const loginAdminUserSchema = z.object({
	username: z
		.string()
		.min(8, 'O apelido de usuário precisa de pelo menos 8 caracteres')
		.max(40, 'O apelido ou e-mail de usuário não pode ter mais do que 40 caracteres')
		.nonempty('O campo de usuário é obrigatório'),
	password: z
		.string()
		.min(8, 'A senha precisa de no mínimo 6 caracteres')
		.max(24, 'A senha só pode ter no máximo 24 caracteres')
		.nonempty('O campo de senha é obrigatório'),
});
type TLoginUserAdmin = z.infer<typeof loginAdminUserSchema>;

export default function Login() {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TLoginUserAdmin>({
		resolver: zodResolver(loginAdminUserSchema),
	});
	async function handleLogin(data: TLoginUserAdmin) {
		await apiV1
			.post<any>('/admin/auth', {
				email: data.username,
				password: data.password,
			})
			.then(res => {
				console.log(res);
			});
	}
	return (
		<>
			<Head>
				<title>Login - Autentique-se no sistema</title>
			</Head>

			<main className='flex flex-col h-screen items-center justify-center bg-zinc-100'>
				<section className='flex flex-1 w-[26rem] min-h-80 max-h-96 bg-white rounded-lg shadow-sm'>
					<div className='flex flex-1 flex-col items-center justify-center p-6 gap-2'>
						<div className='my-2 h-24'>
							<Logo
								width={100}
								height={100}
							/>
						</div>

						<form
							onSubmit={handleSubmit(handleLogin)}
							className='flex flex-col gap-2 w-full'>
							<input
								{...register('username')}
								autoFocus
								required
								type='text'
								placeholder='Usuário'
								className='p-2 h-10 rounded border border-zinc-200'
							/>
							{errors.username && (
								<span className='text-red-400 text-sm'>
									{errors.username.message}
								</span>
							)}
							<input
								required
								{...register('password')}
								type='password'
								placeholder='Senha'
								className='p-2 h-10 rounded border border-zinc-200'
							/>
							{errors.password && (
								<span className='text-red-400 text-sm'>
									{errors.password.message}
								</span>
							)}
							<XButton
								xType='Primary'
								xTitle='Entrar'
								type='submit'
							/>
						</form>
					</div>
				</section>
			</main>
		</>
	);
}
