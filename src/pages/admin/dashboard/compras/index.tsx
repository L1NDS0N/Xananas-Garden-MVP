import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import DefaultPage from '../../../../components/DefaultPage';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../lib/api';
import { useProducts } from '../../../../hooks/useSWRProducts';
import {
  Plus, X, ShoppingCart, Package, Truck, MagnifyingGlass,
  Calendar, FileText, Trash, GridFour, List
} from 'phosphor-react';
import useSWR from 'swr';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import Pagination from '../../../../components/Pagination';

interface PurchaseItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitCost: number;
}

interface Purchase {
  id: string;
  type: string;
  invoice?: string | null;
  total: number;
  notes?: string | null;
  createdAt: string;
  supplier?: { id: string; name: string } | null;
  user?: { name: string } | null;
  items: { id: string; quantity: number; unitCost: number; totalCost: number; product: { id: string; name: string } }[];
}

const fetcher = (url: string) => api.get(url).then(r => r.data);

const Compras: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const { products } = useProducts();
  const { data: purchases, isLoading, mutate } = useSWR<Purchase[]>('/purchases', fetcher);
  const { data: suppliers } = useSWR<any[]>('/suppliers?active=true', fetcher);

  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState<Purchase | null>(null);
  const [type, setType] = useState<'stock' | 'standalone'>('stock');
  const [invoice, setInvoice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const [addingProductId, setAddingProductId] = useState('');
  const [addingProductSearch, setAddingProductSearch] = useState('');
  const [addingProductPickerOpen, setAddingProductPickerOpen] = useState(false);
  const [addingQty, setAddingQty] = useState('1');
  const [addingCost, setAddingCost] = useState('');
  const [supplierCosts, setSupplierCosts] = useState<Record<string, number>>({});

  const selectedAddingProduct = (products as any[]).find((p: any) => p.id === addingProductId) || null;

  const filteredAddingProducts = React.useMemo(() => {
    const list = products as any[];
    if (!addingProductSearch.trim()) return list.slice(0, 30);
    const term = addingProductSearch.toLowerCase();
    return list.filter((p: any) => p.name?.toLowerCase().includes(term)).slice(0, 30);
  }, [products, addingProductSearch]);

  // Load this supplier's known per-product costs so they can prefill the "custo unitário" field
  useEffect(() => {
    if (!supplierId) { setSupplierCosts({}); return; }
    api.get(`/suppliers/${supplierId}`).then(r => {
      const map: Record<string, number> = {};
      (r.data?.products || []).forEach((sp: any) => {
        if (sp.costPrice != null) map[sp.productId] = sp.costPrice;
      });
      setSupplierCosts(map);
    }).catch(() => setSupplierCosts({}));
  }, [supplierId]);

  // Prefill the cost field when a product with a known supplier cost is selected (only if left blank)
  useEffect(() => {
    if (!addingProductId) return;
    const known = supplierCosts[addingProductId];
    if (known != null && !addingCost) setAddingCost(String(known));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addingProductId, supplierCosts]);

  const filtered = (purchases || []).filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.supplier?.name?.toLowerCase().includes(s) ||
      p.invoice?.toLowerCase().includes(s) ||
      p.id.slice(0, 8).includes(s);
  });
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const totalCart = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

  const addItem = () => {
    if (!addingProductId) { toast('Selecione um produto', 'warning'); return; }
    const qty = parseInt(addingQty);
    const cost = parseFloat(addingCost);
    if (!qty || qty <= 0) { toast('Quantidade inválida', 'warning'); return; }
    if (!cost || cost <= 0) { toast('Custo inválido', 'warning'); return; }

    const product = (products as any[]).find((p: any) => p.id === addingProductId);
    const existing = items.findIndex(i => i.productId === addingProductId);

    if (existing >= 0) {
      const updated = [...items];
      updated[existing].quantity += qty;
      setItems(updated);
    } else {
      setItems([...items, { productId: addingProductId, productName: product?.name, quantity: qty, unitCost: cost }]);
    }
    setAddingProductId('');
    setAddingProductSearch('');
    setAddingQty('1');
    setAddingCost('');
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (items.length === 0) { toast('Adicione pelo menos um item', 'warning'); return; }
    setSaving(true);
    try {
      await api.post('/purchases', {
        type,
        invoice: invoice || null,
        supplierId: supplierId || null,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })),
        notes: notes || null,
      });
      toast(`Compra registrada! ${type === 'stock' ? 'Estoque atualizado.' : ''}`, 'success');
      mutate();
      setCreateModal(false);
      resetForm();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao registrar compra', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setType('stock');
    setInvoice('');
    setSupplierId('');
    setNotes('');
    setItems([]);
  };

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <AuthGuard>
      <DefaultPage title="Compras">
        <Head><title>Compras - Admin - Xananas&apos; Garden</title></Head>
        <ToastContainer />
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="flex flex-col lg:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-4 md:p-6 min-w-0 pb-20 lg:pb-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Compras</h1>
                  <p className="text-sm text-gray-500">Registros de compras — estoque e avulsas</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-[#de818d]' : 'text-gray-400'}`}><GridFour size={18} /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-[#de818d]' : 'text-gray-400'}`}><List size={18} /></button>
                  </div>
                  <button onClick={() => { resetForm(); setCreateModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 btn-glass-pink-solid text-white rounded-lg text-sm font-medium">
                    <Plus size={16} /> Nova Compra
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-10">
                  <MagnifyingGlass size={16} className="text-gray-400" />
                  <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="flex-1 bg-transparent outline-none text-sm" placeholder="Buscar compra..." />
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20"><AnimatedLogo /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhuma compra registrada</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginated.map(p => (
                    <div key={p.id} onClick={() => setDetailModal(p)}
                      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${p.type === 'stock' ? 'bg-green-100' : 'bg-orange-100'}`}>
                            {p.type === 'stock' ? <Package size={20} className="text-green-600" /> : <FileText size={20} className="text-orange-600" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{p.supplier?.name || 'Sem fornecedor'}</h3>
                            <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.type === 'stock' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {p.type === 'stock' ? 'Estoque' : 'Avulsa'}
                        </span>
                      </div>
                      {p.invoice && <p className="text-xs text-gray-500 mb-2">NF: {p.invoice}</p>}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-sm">
                        <span className="text-gray-500">{p.items?.length || 0} itens</span>
                        <span className="font-bold text-gray-800">{formatBRL(p.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Fornecedor</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Nota</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-500">Itens</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginated.map(p => (
                        <tr key={p.id} onClick={() => setDetailModal(p)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors">
                          <td className="px-4 py-3 text-gray-600">{formatDate(p.createdAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.type === 'stock' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                              {p.type === 'stock' ? 'Estoque' : 'Avulsa'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{p.supplier?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-500">{p.invoice || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{p.items?.length || 0} itens</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatBRL(p.total)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={(e) => { e.stopPropagation(); setDetailModal(p); }}
                              className="text-blue-500 hover:text-blue-700 p-1"><FileText size={16} /></button>
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

        {/* Create Modal */}
        {createModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Nova Compra</h2>
                <button onClick={() => setCreateModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-4">
                {/* Type selector */}
                <div className="flex gap-3">
                  <button onClick={() => setType('stock')}
                    className={`flex-1 p-3 rounded-lg border text-sm text-center font-medium transition-colors ${type === 'stock' ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <Package size={20} className="mx-auto mb-1" />
                    Entrada no Estoque
                  </button>
                  <button onClick={() => setType('standalone')}
                    className={`flex-1 p-3 rounded-lg border text-sm text-center font-medium transition-colors ${type === 'standalone' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <FileText size={20} className="mx-auto mb-1" />
                    Compra Avulsa
                  </button>
                </div>
                {type === 'stock' && <p className="text-xs text-green-600 -mt-2">O estoque dos produtos será atualizado automaticamente</p>}

                {/* Invoice + Supplier */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Nota Fiscal / Código</label>
                    <input type="text" value={invoice} onChange={e => setInvoice(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="NF-0001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Fornecedor</label>
                    <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                      <option value="">Nenhum</option>
                      {(suppliers || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Add item */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Adicionar Item</h4>
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 relative">
                      {selectedAddingProduct ? (
                        <div className="flex items-center justify-between border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white">
                          <span className="text-gray-700 truncate">{selectedAddingProduct.name}</span>
                          <button type="button" onClick={() => { setAddingProductId(''); setAddingProductSearch(''); }}
                            className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={addingProductSearch}
                          onChange={e => { setAddingProductSearch(e.target.value); setAddingProductPickerOpen(true); }}
                          onFocus={() => setAddingProductPickerOpen(true)}
                          onBlur={() => setTimeout(() => setAddingProductPickerOpen(false), 150)}
                          placeholder="Produto..."
                          className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-[#de818d]"
                        />
                      )}
                      {addingProductPickerOpen && !selectedAddingProduct && (
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                          {filteredAddingProducts.length === 0 ? (
                            <p className="p-3 text-xs text-gray-400 text-center">Nenhum produto encontrado</p>
                          ) : (
                            filteredAddingProducts.map((p: any) => (
                              <button key={p.id} type="button"
                                onMouseDown={() => { setAddingProductId(p.id); setAddingProductSearch(''); setAddingProductPickerOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col">
                                <span className="text-gray-700">{p.name} — {formatBRL(p.price || 0)}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={addingQty} onChange={e => setAddingQty(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm" placeholder="Qtd" min="1" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" step="0.01" value={addingCost} onChange={e => setAddingCost(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm" placeholder="Custo unit." />
                      {supplierCosts[addingProductId] != null && (
                        <p className="text-[10px] text-green-600 mt-0.5">Preço do fornecedor: {formatBRL(supplierCosts[addingProductId])}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <button onClick={addItem}
                        className="w-full px-3 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                        <Plus size={16} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items list */}
                {items.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Itens ({items.length})</h4>
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">{item.productName || item.productId}</span>
                          <span className="text-xs text-gray-400 ml-2">{item.quantity}x × {formatBRL(item.unitCost)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{formatBRL(item.quantity * item.unitCost)}</span>
                          <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><Trash size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-16 resize-none" placeholder="Notas..." />
                </div>

                {/* Total */}
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total:</span>
                  <span className="text-xl font-bold text-gray-800">{formatBRL(totalCart)}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t">
                <button onClick={() => setCreateModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleSave} disabled={saving || items.length === 0}
                  className="px-4 py-2 text-sm btn-glass-pink-solid text-white rounded-lg disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Registrar Compra'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {detailModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Detalhes da Compra</h2>
                <button onClick={() => setDetailModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Data:</span> <span className="font-medium">{formatDate(detailModal.createdAt)}</span></div>
                  <div><span className="text-gray-500">Tipo:</span>
                    <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-medium ${detailModal.type === 'stock' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {detailModal.type === 'stock' ? 'Estoque' : 'Avulsa'}
                    </span>
                  </div>
                  <div><span className="text-gray-500">Fornecedor:</span> <span className="font-medium">{detailModal.supplier?.name || '—'}</span></div>
                  <div><span className="text-gray-500">Nota:</span> <span className="font-medium">{detailModal.invoice || '—'}</span></div>
                  <div><span className="text-gray-500">Responsável:</span> <span className="font-medium">{detailModal.user?.name || '—'}</span></div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Itens</h4>
                  <div className="space-y-1">
                    {detailModal.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="text-gray-700">{item.product?.name}</span>
                        <span className="text-gray-500">{item.quantity}x × {formatBRL(item.unitCost)}</span>
                        <span className="font-semibold text-gray-800">{formatBRL(item.totalCost)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {detailModal.notes && (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                    <span className="font-medium">Obs:</span> {detailModal.notes}
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="font-medium text-gray-600">Total:</span>
                  <span className="text-xl font-bold text-gray-800">{formatBRL(detailModal.total)}</span>
                </div>
              </div>
              <div className="flex justify-end p-4 border-t">
                <button onClick={() => setDetailModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </DefaultPage>
    </AuthGuard>
  );
};

export default Compras;
