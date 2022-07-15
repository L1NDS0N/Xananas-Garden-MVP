import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { hasPageAccess, Role } from '../../lib/permissions';
import AnimatedLogo from '../AnimatedLogo';
import { ShieldWarning } from 'phosphor-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AnimatedLogo size={50} />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = `/admin/login?redirect=${encodeURIComponent(router.pathname)}`;
    }
    return null;
  }

  // Check role-based page access — fallback to 'admin' if admin:true but no role set
  const role = ((user as any)?.role || ((user as any)?.admin ? 'admin' : 'viewer')) as Role;
  if (!hasPageAccess(role, router.pathname)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <ShieldWarning size={64} className="mx-auto text-red-300 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
          <p className="text-gray-500 mb-6">
            Você não tem permissão para acessar esta página.<br />
            Seu perfil: <span className="font-medium text-[#de818d]">{role || 'Não definido'}</span>
          </p>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-6 py-2 bg-[#de818d] text-white rounded-lg hover:bg-[#c96a76] transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
