import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Logo from '../../../assets/Logo';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/Toast';
import { loginSchema, LoginFormData } from '../../../lib/validations';
import AnimatedLogo from '../../../components/AnimatedLogo';

const Login: React.FC = () => {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { toast, ToastContainer } = useToast();
  const [formData, setFormData] = useState<LoginFormData>({ username: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle error from Google OAuth redirect
  useEffect(() => {
    const error = router.query.error as string;
    const email = router.query.email as string;
    if (error === 'no_account' && email) {
      toast(`Nenhuma conta encontrada com o email ${email}. Crie uma conta primeiro no painel administrativo.`, 'error');
    } else if (error === 'google_denied') {
      toast('Login com Google cancelado.', 'error');
    } else if (error === 'auth_failed') {
      toast('Erro ao autenticar com Google. Tente novamente.', 'error');
    }
  }, [router.query.error, router.query.email]);

  React.useEffect(() => {
    if (isAuthenticated) {
      if (window.opener) {
        window.opener.postMessage('LOGIN_SUCCESS', '*');
        window.close();
        return;
      }
      window.location.href = '/catalogo';
    }
  }, [isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate with Zod
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof LoginFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.username, formData.password);

      // If opened as popup, notify parent via postMessage and close
      if (window.opener) {
        window.opener.postMessage('LOGIN_SUCCESS', '*');
        window.close();
        return;
      }

      // Direct access — redirect to catalog
      window.location.href = '/catalogo';
    } catch (error: any) {
      toast(error.message || 'Erro ao fazer login', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Xananas&apos; Garden</title>
      </Head>
      <ToastContainer />
      <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 to-rose-100 items-center justify-center">
        <div className="flex flex-col w-96 max-w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#de818d] to-[#c46878] p-6 text-center backdrop-blur-sm">
            <Logo width={80} className="mx-auto mb-2" />
            <h1 className="text-white font-gloria text-2xl">Xananas&apos; Garden</h1>
            <p className="text-white/80 text-sm mt-1">Acesse o painel administrativo</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#de818d] ${
                  errors.username ? 'border-red-400 bg-red-50' : 'border-zinc-200'
                }`}
                placeholder="Digite seu usuário"
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#de818d] ${
                  errors.password ? 'border-red-400 bg-red-50' : 'border-zinc-200'
                }`}
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-glass-pink-solid disabled:bg-gray-400 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <AnimatedLogo size={16} />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">ou</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google Login */}
            <button
              type="button"
              disabled={googleLoading}
              onClick={() => {
                setGoogleLoading(true);
                window.location.href = '/api/v1/auth/google';
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {googleLoading ? (
                <AnimatedLogo size={16} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span className="text-sm font-medium text-gray-700">Entrar com Google</span>
            </button>
            <p className="text-[10px] text-gray-400 text-center -mt-1">
              Apenas para contas já cadastradas no sistema
            </p>

          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
