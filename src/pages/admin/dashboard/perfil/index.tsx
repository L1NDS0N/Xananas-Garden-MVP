import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { useToast } from '../../../../components/Toast';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../lib/api';
import useSWR from 'swr';
import { UserCircle, FloppyDisk, Link as LinkIcon, Check, X, Trash, Star, LockKey, Eye, EyeSlash } from 'phosphor-react';
import AnimatedLogo from '../../../../components/AnimatedLogo';

interface GoogleAccount {
  id: string;
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
  isPrimary: boolean;
  createdAt: string;
}

const Perfil: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // SWR for Google accounts — auto-refetches on focus
  const { data: googleAccounts = [], mutate: mutateAccounts, isLoading: loadingGoogle } = useSWR<GoogleAccount[]>(
    user?.id ? `/users/${user.id}/google-accounts` : null,
    (url: string) => api.get(url).then(r => r.data || []),
    { revalidateOnFocus: true, revalidateOnReconnect: true }
  );

  // Listen for Google link success from popup
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === 'GOOGLE_LINK_SUCCESS') {
        toast('Conta Google vinculada com sucesso!', 'success');
        mutateAccounts();
        setTimeout(() => window.location.reload(), 800);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/users/${user?.id}`, { name, phone, whatsapp });
      toast('Perfil atualizado!', 'success');
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast('Preencha todos os campos de senha', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast('A nova senha deve ter ao menos 6 caracteres', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('A confirmação não corresponde à nova senha', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put(`/users/${user?.id}/password`, { currentPassword, newPassword });
      toast('Senha alterada com sucesso!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao alterar senha', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleGoogleLink = async () => {
    try {
      const r = await api.get(`/auth/google?mode=link&userId=${user?.id}`);
      const { url } = r.data;
      if (url) {
        window.open(url, '_blank', 'height=600,width=500');
      }
    } catch {
      toast('Erro ao gerar link do Google', 'error');
    }
  };

  const unlinkGoogleAccount = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja desvincular esta conta Google?')) return;
    try {
      await api.delete(`/users/${user?.id}/google-accounts/${accountId}`);
      toast('Conta Google desvinculada', 'success');
      mutateAccounts();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao desvincular', 'error');
    }
  };

  const setPrimaryAccount = async (accountId: string) => {
    try {
      await api.put(`/users/${user?.id}/google-accounts/${accountId}`, { isPrimary: true });
      toast('Avatar principal atualizado!', 'success');
      mutateAccounts();
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao definir avatar', 'error');
    }
  };

  return (
    <AuthGuard>
      <Head><title>Meu Perfil - Admin - Xananas&apos; Garden</title></Head>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">
            <div className="max-w-xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h1>

              {/* Avatar section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-5">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name}
                      className="w-20 h-20 rounded-full object-cover border-3 border-[#de818d]" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserCircle size={40} className="text-gray-300" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{user?.name}</h2>
                    <p className="text-sm text-gray-500">@{user?.username}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Google Accounts Management */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <LinkIcon size={18} className="text-[#de818d]" />
                    Contas Google Vinculadas
                  </h3>
                  <button onClick={() => mutateAccounts()} className="text-xs text-gray-400 hover:text-[#de818d] transition-colors">
                    Atualizar
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Vincule múltiplas contas Google. Escolha qual avatar usar no catálogo.
                </p>

                {loadingGoogle ? (
                  <div className="flex justify-center py-4"><AnimatedLogo size={20} /></div>
                ) : (
                  <div className="space-y-3 mb-4">
                    {googleAccounts.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-3">
                        Nenhuma conta Google vinculada
                      </p>
                    ) : (
                      googleAccounts.map(acc => (
                        <div key={acc.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            acc.isPrimary ? 'border-[#de818d]/30 bg-[#de818d]/5' : 'border-gray-100 hover:bg-gray-50'
                          }`}>
                          {acc.avatar ? (
                            <img src={acc.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <UserCircle size={20} className="text-gray-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{acc.name || acc.email}</p>
                            <p className="text-xs text-gray-400 truncate">{acc.email}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {acc.isPrimary && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#de818d]/10 text-[#de818d]">
                                Avatar
                              </span>
                            )}
                            {!acc.isPrimary && (
                              <button onClick={() => setPrimaryAccount(acc.id)}
                                className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded transition-colors"
                                title="Usar como avatar">
                                <Star size={14} />
                              </button>
                            )}
                            <button onClick={() => unlinkGoogleAccount(acc.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Desvincular">
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <button onClick={handleGoogleLink}
                  className="flex items-center gap-3 w-full px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Vincular nova conta Google</span>
                </button>
              </div>

              {/* Edit fields */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
                <h3 className="font-semibold text-gray-800">Editar Dados</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                    placeholder="(84) 99999-9999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                    placeholder="5584999999999" />
                  <p className="text-xs text-gray-400 mt-1">Este número aparece nos botões WhatsApp dos seus produtos.</p>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                  {saving ? <AnimatedLogo size={14} /> : <FloppyDisk size={16} />}
                  Salvar Alterações
                </button>
              </div>

              {/* Change password */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <LockKey size={18} className="text-[#de818d]" />
                  Alterar Senha
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
                  <input type={showPasswords ? 'text' : 'password'} value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
                    <input type={showPasswords ? 'text' : 'password'} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} autoComplete="new-password"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
                    <input type={showPasswords ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <button onClick={handleChangePassword} disabled={savingPassword}
                    className="flex items-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                    {savingPassword ? <AnimatedLogo size={14} /> : <LockKey size={16} />}
                    Alterar Senha
                  </button>
                  <button type="button" onClick={() => setShowPasswords(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#de818d] transition-colors">
                    {showPasswords ? <EyeSlash size={14} /> : <Eye size={14} />}
                    {showPasswords ? 'Ocultar' : 'Mostrar'} senhas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Perfil;
