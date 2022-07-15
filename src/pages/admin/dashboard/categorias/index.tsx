import React, { useState } from 'react';
import Head from 'next/head';
import { Plus, Trash, FolderPlus, X, Pencil, FloppyDisk, GridFour, List } from 'phosphor-react';
import useSWR from 'swr';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import { api } from '../../../../lib/api';
import { useToast } from '../../../../components/Toast';
import Pagination from '../../../../components/Pagination';
import SearchInput from '../../../../components/SearchInput';

interface Category {
  id: string;
  name: string;
}

const fetcher = (url: string) => api.get(url).then(res => res.data);

const AdminCategorias: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { data: categories, mutate } = useSWR<Category[]>('/products-category', fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
  });

  // Filter + paginate
  const filtered = searchTerm
    ? (categories || []).filter((c: Category) => c.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : (categories || []);
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset page when search changes
  const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setCategoryName('');
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setIsEditing(true);
    setEditingId(cat.id);
    setCategoryName(cat.name);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCategoryName('');
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) { toast('Nome é obrigatório', 'error'); return; }
    setSaving(true);
    try {
      if (isEditing && editingId) {
        await api.put(`/products-category/${editingId}`, { name: categoryName.trim() });
        toast('Categoria atualizada!', 'success');
      } else {
        await api.post('/products-category', { name: categoryName.trim() });
        toast('Categoria criada!', 'success');
      }
      closeModal();
      mutate();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await api.delete(`/products-category/${id}`);
      toast('Categoria excluída!', 'success');
      mutate();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao excluir', 'error');
    }
  };

  return (
    <AuthGuard>
      <Head><title>Categorias - Admin - Xananas&apos; Garden</title></Head>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <FolderPlus size={24} className="text-[#de818d]" />
                <h1 className="text-2xl font-bold text-gray-800">Categorias</h1>
                <span className="text-sm text-gray-400">({filtered.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><GridFour size={18} /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><List size={18} /></button>
                </div>
                <button onClick={openCreate}
                  className="flex items-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                  <Plus size={18} /> Nova Categoria
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <SearchInput value={searchTerm} onChange={handleSearch} placeholder="Buscar por nome..." className="max-w-md" />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <FolderPlus size={56} className="mx-auto mb-3 text-gray-200" />
                <p>Nenhuma categoria encontrada</p>
                <button onClick={openCreate} className="mt-4 text-sm text-[#de818d] hover:underline">Criar primeira categoria</button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginated.map(cat => (
                  <div key={cat.id} onClick={() => openEdit(cat)}
                    className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#de818d]/30 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#de818d]/10 flex items-center justify-center">
                        <span className="text-[#de818d] font-bold text-lg">{cat.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(cat)}
                          className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg transition-colors" title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-800 mt-3 truncate">{cat.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {paginated.map(cat => (
                    <div key={cat.id} onClick={() => openEdit(cat)}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#de818d]/10 flex items-center justify-center">
                          <span className="text-[#de818d] font-bold text-sm">{cat.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{cat.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(cat)}
                          className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg transition-colors" title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                          <Trash size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
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

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Categoria *</label>
                <input type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="Ex: Rosas, Vasos, Buquês..." autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                  {saving ? <AnimatedLogo size={14} /> : <FloppyDisk size={16} />}
                  {isEditing ? 'Atualizar' : 'Criar'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm">
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

export default AdminCategorias;
