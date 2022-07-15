import React, { useState } from 'react';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { useToast } from '../../../../components/Toast';
import { userSchema, UserFormData } from '../../../../lib/validations';
import {
  Plus, Pencil, Trash, X, Users, ShieldCheck, User, FloppyDisk,
  GridFour, List, Phone, At, WhatsappLogo, CaretRight
} from 'phosphor-react';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import { useUsers, useUserMutations } from '../../../../hooks/useSWRUsers';
import Pagination from '../../../../components/Pagination';
import SearchInput from '../../../../components/SearchInput';

const Usuarios: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const { users, isLoading: loadingUsers } = useUsers();
  const { createUser, updateUser, deleteUser } = useUserMutations();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '', username: '', email: '', password: '', phone: '', whatsapp: '', admin: true, role: 'admin',
  } as any);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', username: '', email: '', password: '', phone: '', whatsapp: '', admin: true, role: 'admin' } as any);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setIsEditing(true);
    setEditingId(u.id);
    setFormData({
      name: u.name,
      username: u.username,
      email: u.email,
      password: '',
      phone: u.phone || '',
      whatsapp: u.whatsapp || '',
      admin: u.admin,
      role: u.role || 'admin',
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setIsEditing(false);
    setEditingId(null);
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name as keyof UserFormData]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const dataToValidate: any = { ...formData };
    if (isEditing && !formData.password) delete dataToValidate.password;

    // On create, password is required
    if (!isEditing && (!formData.password || formData.password.length < 8)) {
      setErrors({ password: 'Senha deve ter no mínimo 8 caracteres' });
      return;
    }

    const result = userSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UserFormData, string>> = {};
      result.error.errors.forEach(err => {
        fieldErrors[err.path[0] as keyof UserFormData] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && editingId) {
        const updateData: any = {
          name: formData.name, username: formData.username, email: formData.email,
          phone: formData.phone || null, whatsapp: formData.whatsapp || null, admin: formData.admin, role: (formData as any).role || 'admin',
        };
        if (formData.password) { updateData.password = formData.password; updateData.updatePassword = true; }
        await updateUser(editingId, updateData);
        toast('Usuário atualizado!', 'success');
      } else {
        await createUser({ ...formData, password: formData.password || '', phone: formData.phone || undefined, whatsapp: formData.whatsapp || undefined });
        toast('Usuário criado!', 'success');
      }
      closeModal();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao salvar', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await deleteUser(id);
      toast('Usuário excluído!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao excluir', 'error');
    }
  };

  // Filter + paginate
  const filtered = searchTerm
    ? users.filter((u: any) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset page when search changes
  const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };

  return (
    <AuthGuard>
      <Head><title>Usuários - Admin - Xananas&apos; Garden</title></Head>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">

            {/* Header bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-[#de818d]" />
                <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
                <span className="text-sm text-gray-400">({filtered.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400 hover:text-gray-600'}`}>
                    <GridFour size={18} />
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400 hover:text-gray-600'}`}>
                    <List size={18} />
                  </button>
                </div>
                {/* New user */}
                <button onClick={openCreateModal}
                  className="flex items-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                  <Plus size={18} /> Novo Usuário
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <SearchInput value={searchTerm} onChange={handleSearch} placeholder="Buscar por nome, username, email ou telefone..." className="max-w-md" />
            </div>

            {/* Users */}
            {loadingUsers ? (
              <div className="flex items-center justify-center py-20"><AnimatedLogo size={48} /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Users size={56} className="mx-auto mb-3 text-gray-200" />
                <p className="text-lg">Nenhum usuário encontrado</p>
                <button onClick={openCreateModal}
                  className="mt-4 text-sm text-[#de818d] hover:underline">Criar primeiro usuário</button>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginated.map((u: any) => (
                  <div key={u.id}
                    onClick={() => openEditModal(u)}
                    className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#de818d]/30 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-4">
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 group-hover:border-[#de818d]/30" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${u.admin ? 'bg-[#de818d]/10' : 'bg-gray-100'}`}>
                          {u.admin ? <ShieldCheck size={20} className="text-[#de818d]" /> : <User size={20} className="text-gray-400" />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2 truncate">
                        <At size={12} className="text-gray-300 shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      {u.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-gray-300 shrink-0" />
                          <span>{u.phone}</span>
                        </div>
                      )}
                      {u.whatsapp && (
                        <div className="flex items-center gap-2">
                          <WhatsappLogo size={12} className="text-green-500 shrink-0" />
                          <span>{u.whatsapp}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${u.admin ? 'bg-[#de818d]/10 text-[#de818d]' : 'bg-gray-100 text-gray-500'}`}>
                        {u.admin ? <ShieldCheck size={10} /> : <User size={10} />}
                        {u.admin ? 'Admin' : 'Usuário'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={e => { e.stopPropagation(); handleDelete(u.id); }}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Excluir">
                          <Trash size={14} />
                        </button>
                        <CaretRight size={14} className="text-gray-200 group-hover:text-[#de818d] transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Usuário</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Telefone</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">WhatsApp</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Perfil</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500">Criado em</th>
                        <th className="text-right px-6 py-3 font-medium text-gray-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginated.map((u: any) => (
                        <tr key={u.id} onClick={() => openEditModal(u)}
                          className="hover:bg-gray-50 transition-colors cursor-pointer">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${u.admin ? 'bg-[#de818d]/10' : 'bg-gray-100'}`}>
                                  {u.admin ? <ShieldCheck size={14} className="text-[#de818d]" /> : <User size={14} className="text-gray-400" />}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800">{u.name}</p>
                                <p className="text-xs text-gray-400">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-gray-600">{u.email}</td>
                          <td className="px-6 py-3 text-gray-600">{u.phone || <span className="text-gray-300">—</span>}</td>
                          <td className="px-6 py-3 text-gray-600">{u.whatsapp || <span className="text-gray-300">—</span>}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${u.admin ? 'bg-[#de818d]/10 text-[#de818d]' : 'bg-gray-100 text-gray-500'}`}>
                              {u.admin ? <ShieldCheck size={10} /> : <User size={10} />}
                              {u.admin ? 'Admin' : 'Usuário'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                              <button onClick={() => openEditModal(u)}
                                className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg transition-colors" title="Editar">
                                <Pencil size={15} />
                              </button>
                              <button onClick={() => handleDelete(u.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                <Trash size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* MODAL — Create / Edit User */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#de818d]`}
                  placeholder="Nome completo" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm ${errors.username ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#de818d]`}
                    placeholder="nome_usuario" />
                  {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#de818d]`}
                    placeholder="email@exemplo.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                    placeholder="(84) 99999-9999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input type="tel" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                    placeholder="5584999999999" />
                  <p className="text-[10px] text-gray-400 mt-0.5">Número com código do país</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {isEditing ? '(deixe vazio para manter)' : '*'}
                </label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#de818d]`}
                  placeholder={isEditing ? '••••••••' : 'Mínimo 8 caracteres'} />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Acesso</label>
                <select name="role" value={(formData as any).role || 'admin'} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]">
                  <option value="admin">🛡️ Administrador — Acesso total</option>
                  <option value="manager">📋 Gerente — Produtos, vendas, relatórios</option>
                  <option value="cashier">💰 Caixa — PDV, estoque, clientes</option>
                  <option value="viewer">👁️ Visualizador — Somente leitura</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Controla o que o usuário pode acessar no painel</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                  {isSubmitting ? <AnimatedLogo size={14} /> : <FloppyDisk size={16} />}
                  {isEditing ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
};

export default Usuarios;
