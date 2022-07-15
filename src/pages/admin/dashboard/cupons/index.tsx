import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../lib/api';
import { Ticket, Plus, Pencil, Trash, X, Copy, GridFour, List, Package, FolderOpen, Globe, Check, ClockCounterClockwise } from 'phosphor-react';
import Pagination from '../../../../components/Pagination';
import SearchInput from '../../../../components/SearchInput';

interface Coupon {
  id: string; code: string; description?: string | null;
  discountType: string; discountValue: number;
  targetType: string; targetId?: string | null;
  minAmount: number; maxUses?: number | null; usedCount: number;
  startsAt?: string | null; expiresAt?: string | null;
  active: boolean; createdAt: string;
}

interface Product { id: string; name: string; price: number; }
interface Category { id: string; name: string; }
interface CouponUsage {
  id: string;
  discountAmount: number;
  createdAt: string;
  coupon: { code: string; discountType: string; discountValue: number };
  user?: { id: string; name: string } | null;
  sale?: { id: string; finalTotal: number; createdAt: string } | null;
}

const TARGET_OPTIONS = [
  { value: 'global', label: 'Todos os produtos', icon: Globe, color: 'text-gray-500' },
  { value: 'category', label: 'Por categoria', icon: FolderOpen, color: 'text-blue-500' },
  { value: 'product', label: 'Produto específico', icon: Package, color: 'text-green-500' },
];

const Cupons: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const { data: coupons = [], mutate } = useSWR<Coupon[]>('/coupons', (url: string) => api.get(url).then(r => r.data));
  const { data: categories = [] } = useSWR<Category[]>('/products-category', (url: string) => api.get(url).then(r => r.data));
  const { data: products = [] } = useSWR<Product[]>('/products', (url: string) => api.get(url).then(r => r.data));
  const [activeTab, setActiveTab] = useState<'coupons' | 'usage'>('coupons');
  const { data: usages = [], isLoading: loadingUsages } = useSWR<CouponUsage[]>(
    activeTab === 'usage' ? '/coupons/usage' : null, (url: string) => api.get(url).then(r => r.data)
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [targetSearch, setTargetSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percentage', discountValue: 0,
    targetType: 'global', targetId: '',
    minAmount: 0, maxUses: '', startsAt: '', expiresAt: '', active: true,
  });

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const filteredTargetItems = useMemo(() => {
    if (!targetSearch) return form.targetType === 'category' ? categories : products;
    const term = targetSearch.toLowerCase();
    if (form.targetType === 'category') {
      return categories.filter((c: Category) => c.name.toLowerCase().includes(term));
    }
    return products.filter((p: Product) => p.name.toLowerCase().includes(term));
  }, [form.targetType, targetSearch, categories, products]);

  const getTargetLabel = (c: Coupon) => {
    if (c.targetType === 'category' && c.targetId) {
      const cat = categories.find((ca: Category) => ca.id === c.targetId);
      return `📂 ${cat?.name || 'Categoria'}`;
    }
    if (c.targetType === 'product' && c.targetId) {
      const prod = products.find((p: Product) => p.id === c.targetId);
      return `📦 ${prod?.name || 'Produto'}`;
    }
    return '🌍 Todos';
  };

  const openCreate = () => {
    setIsEditing(false); setEditingId(null);
    setForm({ code: '', description: '', discountType: 'percentage', discountValue: 0, targetType: 'global', targetId: '', minAmount: 0, maxUses: '', startsAt: '', expiresAt: '', active: true });
    setTargetSearch(''); setModalOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setIsEditing(true); setEditingId(c.id);
    setForm({
      code: c.code, description: c.description || '', discountType: c.discountType,
      discountValue: c.discountValue, targetType: c.targetType || 'global', targetId: c.targetId || '',
      minAmount: c.minAmount, maxUses: c.maxUses?.toString() || '',
      startsAt: c.startsAt ? c.startsAt.split('T')[0] : '', expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '', active: c.active,
    });
    setTargetSearch(''); setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) { toast('Preencha código e valor', 'warning'); return; }
    if ((form.targetType === 'category' || form.targetType === 'product') && !form.targetId) {
      toast('Selecione o alvo do cupom', 'warning'); return;
    }
    try {
      const data = {
        ...form,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        discountValue: Number(form.discountValue),
        minAmount: Number(form.minAmount),
        targetId: form.targetType === 'global' ? null : form.targetId || null,
      };
      if (isEditing && editingId) {
        await api.put('/coupons', { id: editingId, ...data });
        toast('Cupom atualizado!', 'success');
      } else {
        await api.post('/coupons', data);
        toast('Cupom criado!', 'success');
      }
      setModalOpen(false); mutate();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao salvar', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cupom?')) return;
    try { await api.delete(`/coupons?id=${id}`); toast('Cupom excluído!', 'success'); mutate(); }
    catch { toast('Erro ao excluir', 'error'); }
  };

  const handleToggle = async (c: Coupon) => {
    try { await api.put('/coupons', { id: c.id, active: !c.active }); mutate(); }
    catch { toast('Erro ao alterar', 'error'); }
  };

  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast('Código copiado!', 'success'); };

  // Filter + paginate
  const filteredCoupons = searchTerm
    ? coupons.filter((c: Coupon) =>
        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : coupons;
  const totalPages = Math.ceil(filteredCoupons.length / perPage);
  const paginatedCoupons = filteredCoupons.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset page when search changes
  const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };

  return (
    <AuthGuard>
      <Head><title>Cupons - Admin - Xananas&apos; Garden</title></Head>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Ticket size={24} className="text-[#de818d]" />
                <h1 className="text-2xl font-bold text-gray-800">Cupons</h1>
                <span className="text-sm text-gray-400">({activeTab === 'coupons' ? filteredCoupons.length : usages.length})</span>
              </div>
              {activeTab === 'coupons' && (
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><GridFour size={18} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><List size={18} /></button>
                  </div>
                  <button onClick={openCreate} className="flex items-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                    <Plus size={18} /> Novo Cupom
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setActiveTab('coupons')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'coupons' ? 'bg-[#de818d] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Ticket size={16} /> Cupons
              </button>
              <button onClick={() => setActiveTab('usage')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'usage' ? 'bg-[#de818d] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <ClockCounterClockwise size={16} /> Uso de cupons
              </button>
            </div>

            {activeTab === 'usage' ? (
              loadingUsages ? (
                <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando...</div>
              ) : usages.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <ClockCounterClockwise size={56} className="mx-auto mb-3 text-gray-200" />
                  <p>Nenhum cupom foi utilizado ainda</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Cupom</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Usado por</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Desconto</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Total da venda</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {usages.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-xs text-gray-500">{new Date(u.createdAt).toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-3 font-mono font-bold text-[#de818d]">{u.coupon.code}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{u.user?.name || '-'}</td>
                          <td className="px-4 py-3 text-right text-green-600 text-xs font-medium">-{formatBRL(u.discountAmount)}</td>
                          <td className="px-4 py-3 text-right text-gray-700 text-xs font-bold">{u.sale ? formatBRL(u.sale.finalTotal) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
            <>
            {/* Search */}
            <div className="mb-4">
              <SearchInput value={searchTerm} onChange={handleSearch} placeholder="Buscar por código ou descrição..." className="max-w-md" />
            </div>

            {filteredCoupons.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Ticket size={56} className="mx-auto mb-3 text-gray-200" />
                <p>Nenhum cupom cadastrado</p>
                <button onClick={openCreate} className="mt-4 text-sm text-[#de818d] hover:underline">Criar primeiro cupom</button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedCoupons.map(c => (
                  <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#de818d]/30 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-bold text-[#de818d] text-lg">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="p-1 text-gray-400 hover:text-[#de818d]" title="Copiar"><Copy size={14} /></button>
                    </div>
                    <div className="mb-2">
                      <span className={`text-2xl font-bold ${c.discountType === 'percentage' ? 'text-green-600' : 'text-blue-600'}`}>
                        {c.discountType === 'percentage' ? `${c.discountValue}%` : formatBRL(c.discountValue)}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{c.discountType === 'percentage' ? 'desconto' : 'de desconto'}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{getTargetLabel(c)}</p>
                    {c.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{c.description}</p>}
                    <div className="text-xs text-gray-400 space-y-1 mb-3">
                      {c.minAmount > 0 && <p>Compra mínima: {formatBRL(c.minAmount)}</p>}
                      {c.maxUses && <p>Usos: {c.usedCount}/{c.maxUses}</p>}
                      {c.expiresAt && <p>Expira: {new Date(c.expiresAt).toLocaleDateString('pt-BR')}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(c)} className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${c.active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {c.active ? 'Ativo' : 'Inativo'}
                      </button>
                      <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Desconto</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Alvo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Usos</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedCoupons.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-bold text-[#de818d]">{c.code}</td>
                        <td className="px-4 py-3 text-gray-700">{c.discountType === 'percentage' ? `${c.discountValue}%` : formatBRL(c.discountValue)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{getTargetLabel(c)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{c.maxUses ? `${c.usedCount}/${c.maxUses}` : `${c.usedCount} / ∞`}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleToggle(c)} className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${c.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {c.active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg"><Pencil size={14} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash size={14} /></button>
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
              totalItems={filteredCoupons.length}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
            />
            </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Editar Cupom' : 'Novo Cupom'}</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="EX: VERAO20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="Cupom de verão" />
              </div>

              {/* Discount type + value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]">
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                  <input type="number" step="0.01" min="0" value={form.discountValue || ''} onChange={e => setForm(p => ({ ...p, discountValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                    placeholder={form.discountType === 'percentage' ? '10' : '5.00'} />
                </div>
              </div>

              {/* Target type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aplicar desconto em</label>
                <div className="grid grid-cols-3 gap-2">
                  {TARGET_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, targetType: opt.value, targetId: '' }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all ${
                          form.targetType === opt.value
                            ? 'border-[#de818d] bg-pink-50 text-[#de818d]'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        <Icon size={20} className={form.targetType === opt.value ? 'text-[#de818d]' : opt.color} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target picker (category or product) */}
              {form.targetType !== 'global' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.targetType === 'category' ? 'Selecionar Categoria' : 'Selecionar Produto'}
                  </label>
                  <input type="text" value={targetSearch} onChange={e => setTargetSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-[#de818d]"
                    placeholder={`Buscar ${form.targetType === 'category' ? 'categoria' : 'produto'}...`} />
                  <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    {filteredTargetItems.length === 0 ? (
                      <p className="p-3 text-center text-gray-400 text-xs">Nenhum encontrado</p>
                    ) : (
                      filteredTargetItems.map((item: any) => (
                        <button key={item.id} type="button"
                          onClick={() => setForm(p => ({ ...p, targetId: item.id }))}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                            form.targetId === item.id ? 'bg-[#de818d]/5 border-l-2 border-[#de818d]' : 'hover:bg-gray-50 border-l-2 border-transparent'
                          }`}>
                          <span className="flex-1 truncate">{item.name}</span>
                          {form.targetId === item.id && <Check size={14} className="text-[#de818d]" />}
                        </button>
                      ))
                    )}
                  </div>
                  {form.targetId && (
                    <p className="text-xs text-[#de818d] mt-1">
                      ✓ {form.targetType === 'category' ? 'Categoria' : 'Produto'} selecionado
                    </p>
                  )}
                </div>
              )}

              {/* Min amount + max uses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compra mínima (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.minAmount || ''} onChange={e => setForm(p => ({ ...p, minAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. usos</label>
                  <input type="number" min="1" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="Ilimitado" />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Válido a partir</label>
                  <input type="date" value={form.startsAt} onChange={e => setForm(p => ({ ...p, startsAt: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expira em</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 text-[#de818d] rounded" />
                <label className="text-sm text-gray-700">Cupom ativo</label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg text-sm">
                  {isEditing ? 'Atualizar' : 'Criar Cupom'}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
};

export default Cupons;
