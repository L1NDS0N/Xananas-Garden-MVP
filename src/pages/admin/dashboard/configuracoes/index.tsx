import Head from 'next/head';
import React, { useState } from 'react';
import Link from 'next/link';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { useAuth } from '../../../../hooks/useAuth';
import { useSWRSettings } from '../../../../hooks/useSWRSettings';
import { Gear, Users, UserCircle, ArrowRight, Check, Warning, CreditCard } from 'phosphor-react';

const Configuracoes: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useSWRSettings();
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Sync input when settings load
  React.useEffect(() => {
    if (settings.default_whatsapp !== undefined) {
      setWhatsapp(settings.default_whatsapp);
    }
  }, [settings.default_whatsapp]);

  const handleSaveWhatsApp = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateSettings({ default_whatsapp: whatsapp.replace(/\D/g, '') });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <Head>
        <title>Configurações - Admin - Xananas&apos; Garden</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <main className="flex-1 p-4 md:p-6 min-w-0 pb-20 lg:pb-6">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Gear size={24} />
                Configurações
              </h1>

              {/* Current user info */}
              {user && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                  <div className="flex items-center gap-4">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-[#de818d]" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#de818d]/10 flex items-center justify-center">
                        <UserCircle size={32} className="text-[#de818d]" />
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-gray-800">{user.name}</h2>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-gray-400">📱 {user.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Platform Default */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  📱 WhatsApp Padrão da Plataforma
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Este é o número de WhatsApp padrão usado quando um produto não possui um anunciante com WhatsApp próprio cadastrado.
                </p>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Número com código do país
                    </label>
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      placeholder="5584999999999"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d] focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSaveWhatsApp}
                    disabled={saving}
                    className="px-5 py-2.5 bg-[#de818d] text-white text-sm font-medium rounded-lg hover:bg-[#c96a76] disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {saving ? (
                      <span className="animate-spin">⏳</span>
                    ) : saved ? (
                      <><Check size={16} /> Salvo!</>
                    ) : (
                      'Salvar'
                    )}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <Warning size={14} /> {error}
                  </p>
                )}
              </div>

              {/* Quick links */}
              <div className="space-y-4">
                <Link
                  href="/admin/dashboard/formas-pagamento"
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 hover:border-[#de818d]/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#de818d]/10 flex items-center justify-center">
                      <CreditCard size={24} className="text-[#de818d]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Formas de Pagamento</h3>
                      <p className="text-sm text-gray-500">Cadastrar formas aceitas, parcelas e descontos/acréscimos</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-400 group-hover:text-[#de818d] transition-colors" />
                </Link>

                <Link
                  href="/admin/dashboard/usuarios"
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 hover:border-[#de818d]/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#de818d]/10 flex items-center justify-center">
                      <Users size={24} className="text-[#de818d]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Gerenciar Usuários</h3>
                      <p className="text-sm text-gray-500">Cadastrar, editar perfis, telefone e foto</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-400 group-hover:text-[#de818d] transition-colors" />
                </Link>

                <Link
                  href="/admin/dashboard/perfil"
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-5 hover:border-[#de818d]/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#de818d]/10 flex items-center justify-center">
                      <UserCircle size={24} className="text-[#de818d]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Meu Perfil</h3>
                      <p className="text-sm text-gray-500">Atualizar foto, telefone e dados pessoais</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-400 group-hover:text-[#de818d] transition-colors" />
                </Link>
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                <p className="text-sm text-blue-700 font-medium">💡 Como funciona o WhatsApp:</p>
                <ul className="text-xs text-blue-600 space-y-1 ml-4">
                  <li>• O <strong>WhatsApp Padrão da Plataforma</strong> acima é usado quando o criador do produto não possui WhatsApp próprio cadastrado.</li>
                  <li>• O campo <strong>WhatsApp</strong> no perfil do usuário tem prioridade sobre o número padrão.</li>
                  <li>• Cada publicador pode ter seu próprio número de WhatsApp no perfil.</li>
                  <li>• Se nenhum número estiver configurado, o botão de WhatsApp não funcionará.</li>
                  <li>• Use o formato internacional: <strong>55 + DDD + Número</strong> (ex: 5584999999999).</li>
                </ul>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Configuracoes;
