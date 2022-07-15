import React, { useState } from 'react';
import useSWR from 'swr';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../lib/api';
import {
  Plus, Pencil, Trash, X, Users, UserCircle, Phone, At,
  IdentificationCard, MapPin, FloppyDisk, GridFour, List, CaretRight
} from 'phosphor-react';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import Pagination from '../../../../components/Pagination';
import SearchInput from '../../../../components/SearchInput';

interface Client {
  id: string; name: string; cpf?: string; phone?: string; whatsapp?: string;
  email?: string; address?: string; notes?: string; createdAt: string;
}

const emptyForm = { name: '', cpf: '', phone: '', whatsapp: '', email: '', address: '', notes: '' };

const Clientes: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const { data: clients = [], mutate, isLoading: loading } = useSWR<Client[]>('/clients', (url: string) => api.get(url).then(r => r.data), { revalidateOnFocus: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);



  const openCreate = () => { setIsEditing(false); setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: Client) => {
    setIsEditing(true); setEditingId(c.id);
    setForm({ name: c.name, cpf: c.cpf || '', phone: c.phone || '', whatsapp: c.whatsapp || '', email: c.email || '', address: c.address || '', notes: c.notes || '' });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setForm(emptyForm); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Nome é obrigatório', 'error'); return; }
    setSaving(true);
    try {
      if (isEditing && editingId) {
        await api.put(`/clients/${editingId}`, form);
        toast('Cliente atualizado!', 'success');
      } else {
        await api.post('/clients', form);
        toast('Cliente criado!', 'success');
      }
      closeModal(); mutate();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao salvar', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return;
    try { await api.delete(`/clients/${id}`); toast('Cliente excluído!', 'success'); mutate(); }
    catch { toast('Erro ao excluir', 'error'); }
  };

  // Filter + paginate
  const filtered = searchTerm
    ? clients.filter((c: any) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : clients;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset page when search changes
  const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };

  return (
    <AuthGuard>
      <Head><title>Clientes - Admin - Xananas&apos; Garden</title></Head>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users size={24} className="text-[#de818d]" />
                <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
                <span className="text-sm text-gray-400">({filtered.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><GridFour size={18} /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><List size={18} /></button>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                  <Plus size={18} /> Novo Cliente
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <SearchInput value={searchTerm} onChange={handleSearch} placeholder="Buscar por nome, CPF, telefone ou email..." className="max-w-md" />
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><AnimatedLogo size={48} /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Users size={56} className="mx-auto mb-3 text-gray-200" />
                <p>Nenhum cliente cadastrado</p>
                <button onClick={openCreate} className="mt-4 text-sm text-[#de818d] hover:underline">Cadastrar primeiro cliente</button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginated.map(c => (
                  <div key={c.id} onClick={() => openEdit(c)} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#de818d]/30 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-[#de818d]/10 flex items-center justify-center">
                        <UserCircle size={24} className="text-[#de818d]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 truncate">{c.name}</p>
                        {c.cpf && <p className="text-xs text-gray-400">{c.cpf}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-500">
                      {c.phone && <div className="flex items-center gap-2"><Phone size={12} className="text-gray-300" />{c.phone}</div>}
                      {c.email && <div className="flex items-center gap-2"><At size={12} className="text-gray-300" />{c.email}</div>}
                      {c.address && <div className="flex items-center gap-2"><MapPin size={12} className="text-gray-300" />{c.address}</div>}
                    </div>
                    <div className="flex justify-end mt-3 pt-2 border-t border-gray-50">
                      <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Nome</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">CPF</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Telefone</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">WhatsApp</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-500">Ações</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map(c => (
                      <tr key={c.id} onClick={() => openEdit(c)} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-3 font-medium text-gray-800">{c.name}</td>
                        <td className="px-6 py-3 text-gray-600">{c.cpf || '—'}</td>
                        <td className="px-6 py-3 text-gray-600">{c.phone || '—'}</td>
                        <td className="px-6 py-3 text-gray-600">{c.whatsapp || '—'}</td>
                        <td className="px-6 py-3 text-gray-600">{c.email || '—'}</td>
                        <td className="px-6 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="Nome do cliente" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                  <input name="cpf" value={form.cpf} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="(84) 99999-9999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="5584999999999" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="email@ex.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input name="address" value={form.address} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="Rua, número, bairro" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="Notas sobre o cliente" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                  {saving ? <AnimatedLogo size={14} /> : <FloppyDisk size={16} />}
                  {isEditing ? 'Atualizar' : 'Cadastrar'}
                </button>
                <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
};

export default Clientes;
