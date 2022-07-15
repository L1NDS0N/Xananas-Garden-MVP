import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import DefaultPage from '../../../../components/DefaultPage';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../lib/api';
import {
  Plus, PencilSimple, Trash, MagnifyingGlass, X, Truck,
  Phone, Envelope, MapPin, Package, Link, CurrencyCircleDollar,
  Check, WarningCircle, GridFour, List
} from 'phosphor-react';
import useSWR from 'swr';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import Pagination from '../../../../components/Pagination';

interface Supplier {
  id: string;
  name: string;
  cnpj?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  active: boolean;
  products?: any[];
  _count?: { purchases: number };
}

const fetcher = (url: string) => api.get(url).then(r => r.data);

const Fornecedores: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const { data: suppliers, isLoading, mutate } = useSWR<Supplier[]>('/suppliers', fetcher);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<Supplier | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', cnpj: '', phone: '', whatsapp: '', email: '', address: '', notes: ''
  });

  // Product linking
  const [linkModal, setLinkModal] = useState(false);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [linkCostPrice, setLinkCostPrice] = useState('');
  const [linking, setLinking] = useState(false);

  const selectedProduct = allProducts.find((p: any) => p.id === selectedProductId) || null;

  const filteredProducts = React.useMemo(() => {
    if (!productSearch.trim()) return allProducts.slice(0, 30);
    const term = productSearch.toLowerCase();
    return allProducts.filter((p: any) => p.name?.toLowerCase().includes(term)).slice(0, 30);
  }, [allProducts, productSearch]);

  const filtered = (suppliers || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.cnpj?.includes(search) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', cnpj: '', phone: '', whatsapp: '', email: '', address: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({
      name: s.name, cnpj: s.cnpj || '', phone: s.phone || '',
      whatsapp: s.whatsapp || '', email: s.email || '', address: s.address || '', notes: s.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Nome é obrigatório', 'warning'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, form);
        toast('Fornecedor atualizado!', 'success');
      } else {
        await api.post('/suppliers', form);
        toast('Fornecedor criado!', 'success');
      }
      mutate();
      setModalOpen(false);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remover fornecedor "${name}"?`)) return;
    try {
      await api.delete(`/suppliers/${id}`);
      toast('Fornecedor removido', 'success');
      mutate();
      setDetailModal(null);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao remover', 'error');
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/products');
      setAllProducts(res.data || []);
    } catch {}
  }, []);

  const openLinkModal = () => {
    loadProducts();
    setSelectedProductId('');
    setProductSearch('');
    setLinkCostPrice('');
    setLinkModal(true);
  };

  const handleLinkProduct = async () => {
    if (!selectedProductId || !detailModal) { toast('Selecione um produto', 'warning'); return; }
    setLinking(true);
    try {
      await api.post(`/suppliers/${detailModal.id}/products`, {
        productId: selectedProductId,
        costPrice: linkCostPrice ? parseFloat(linkCostPrice) : null,
      });
      toast('Produto vinculado!', 'success');
      mutate();
      // Reload detail
      const res = await api.get(`/suppliers/${detailModal.id}`);
      setDetailModal(res.data);
      setLinkModal(false);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao vincular', 'error');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkProduct = async (productId: string) => {
    if (!detailModal) return;
    if (!confirm('Desvincular este produto?')) return;
    try {
      await api.delete(`/suppliers/${detailModal.id}/products`, { data: { productId } });
      toast('Produto desvinculado', 'success');
      mutate();
      const res = await api.get(`/suppliers/${detailModal.id}`);
      setDetailModal(res.data);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro', 'error');
    }
  };

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <AuthGuard>
      <DefaultPage title="Fornecedores">
        <Head><title>Fornecedores - Admin - Xananas&apos; Garden</title></Head>
        <ToastContainer />
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="flex flex-col lg:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-4 md:p-6 min-w-0 pb-20 lg:pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Fornecedores</h1>
                  <p className="text-sm text-gray-500">{filtered.length} fornecedores cadastrados</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-[#de818d]' : 'text-gray-400'}`}><GridFour size={18} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-[#de818d]' : 'text-gray-400'}`}><List size={18} /></button>
                  </div>
                  <button onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 btn-glass-pink-solid text-white rounded-lg text-sm font-medium">
                    <Plus size={16} /> Novo Fornecedor
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-10">
                  <MagnifyingGlass size={16} className="text-gray-400" />
                  <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="flex-1 bg-transparent outline-none text-sm" placeholder="Buscar fornecedor..." />
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20"><AnimatedLogo /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <Truck size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhum fornecedor encontrado</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginated.map(s => (
                    <div key={s.id}
                      onClick={() => setDetailModal(s)}
                      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Truck size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{s.name}</h3>
                            {s.cnpj && <p className="text-xs text-gray-400">CNPJ: {s.cnpj}</p>}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-500">
                        {s.phone && <div className="flex items-center gap-2"><Phone size={14} /> {s.phone}</div>}
                        {s.email && <div className="flex items-center gap-2"><Envelope size={14} /> {s.email}</div>}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                        <span><Package size={12} className="inline mr-1" />{s.products?.length || 0} produtos</span>
                        <span><CurrencyCircleDollar size={12} className="inline mr-1" />{s._count?.purchases || 0} compras</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Fornecedor</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Contato</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Produtos</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Compras</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginated.map(s => (
                        <tr key={s.id} onClick={() => setDetailModal(s)} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{s.name}</p>
                            {s.cnpj && <p className="text-xs text-gray-400">{s.cnpj}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{s.phone || s.email || '-'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{s.products?.length || 0}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{s._count?.purchases || 0}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {s.active ? 'Ativo' : 'Inativo'}
                            </span>
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

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
                <button onClick={() => setModalOpen(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nome *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Nome do fornecedor" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">CNPJ</label>
                  <input type="text" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="00.000.000/0000-00" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                    <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="(84) 99999-9999" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">WhatsApp</label>
                    <input type="text" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="(84) 99999-9999" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="contato@fornecedor.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Endereço</label>
                  <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Rua, número, bairro, cidade" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="Notas internas..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-4 py-2 text-sm btn-glass-pink-solid text-white rounded-lg disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {detailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg"><Truck size={20} className="text-blue-600" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{detailModal.name}</h2>
                    {detailModal.cnpj && <p className="text-xs text-gray-400">CNPJ: {detailModal.cnpj}</p>}
                  </div>
                </div>
                <button onClick={() => setDetailModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-4">
                {/* Contact info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {detailModal.phone && <div className="flex items-center gap-2 text-gray-600"><Phone size={14} />{detailModal.phone}</div>}
                  {detailModal.whatsapp && <div className="flex items-center gap-2 text-green-600"><Phone size={14} />{detailModal.whatsapp}</div>}
                  {detailModal.email && <div className="flex items-center gap-2 text-gray-600"><Envelope size={14} />{detailModal.email}</div>}
                  {detailModal.address && <div className="flex items-center gap-2 text-gray-600"><MapPin size={14} />{detailModal.address}</div>}
                </div>

                {/* Products */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700">Produtos Vinculados</h3>
                    <button onClick={openLinkModal}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                      <Link size={12} /> Vincular Produto
                    </button>
                  </div>
                  {detailModal.products && detailModal.products.length > 0 ? (
                    <div className="space-y-2">
                      {detailModal.products.map((sp: any) => (
                        <div key={sp.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{sp.product?.name}</p>
                            {sp.costPrice && <p className="text-xs text-gray-400">Custo: {formatBRL(sp.costPrice)}</p>}
                          </div>
                          <button onClick={() => handleUnlinkProduct(sp.productId)}
                            className="text-red-400 hover:text-red-600 p-1"><Trash size={14} /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Nenhum produto vinculado</p>
                  )}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600">{detailModal.products?.length || 0}</p>
                    <p className="text-xs text-blue-500">Produtos</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{detailModal._count?.purchases || 0}</p>
                    <p className="text-xs text-green-500">Compras</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between p-4 border-t">
                <div className="flex gap-2">
                  <button onClick={() => { openEdit(detailModal); setDetailModal(null); }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                    <PencilSimple size={14} /> Editar
                  </button>
                  <button onClick={() => handleDelete(detailModal.id, detailModal.name)}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                    <Trash size={14} /> Remover
                  </button>
                </div>
                <button onClick={() => setDetailModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Fechar</button>
              </div>
            </div>
          </div>
        )}

        {/* Link Product Modal */}
        {linkModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Vincular Produto</h2>
                <button onClick={() => setLinkModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Produto</label>
                  {selectedProduct ? (
                    <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                      <span className="text-gray-700 truncate">{selectedProduct.name}</span>
                      <button type="button" onClick={() => { setSelectedProductId(''); setProductSearch(''); }}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setProductPickerOpen(true); }}
                      onFocus={() => setProductPickerOpen(true)}
                      onBlur={() => setTimeout(() => setProductPickerOpen(false), 150)}
                      placeholder="Buscar produto..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#de818d]"
                    />
                  )}
                  {productPickerOpen && !selectedProduct && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                      {filteredProducts.length === 0 ? (
                        <p className="p-3 text-xs text-gray-400 text-center">Nenhum produto encontrado</p>
                      ) : (
                        filteredProducts.map((p: any) => (
                          <button key={p.id} type="button"
                            onMouseDown={() => { setSelectedProductId(p.id); setProductSearch(''); setProductPickerOpen(false); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col">
                            <span className="text-gray-700">{p.name} — {formatBRL(p.price || 0)}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Preço de custo (opcional)</label>
                  <input type="number" step="0.01" value={linkCostPrice} onChange={e => setLinkCostPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="R$ 0,00" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t">
                <button onClick={() => setLinkModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleLinkProduct} disabled={linking}
                  className="px-4 py-2 text-sm btn-glass-pink-solid text-white rounded-lg disabled:opacity-50">
                  {linking ? 'Vinculando...' : 'Vincular'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DefaultPage>
    </AuthGuard>
  );
};

export default Fornecedores;
