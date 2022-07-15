import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import DefaultPage from '../../../../components/DefaultPage';
import { useToast } from '../../../../components/Toast';
import { useProducts } from '../../../../hooks/useSWRProducts';
import { api } from '../../../../lib/api';
import {
  Package, Plus, Minus, ArrowUp, ArrowDown, ArrowRight,
  MagnifyingGlass, FilePdf, Clock, X, GridFour, List
} from 'phosphor-react';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import Pagination from '../../../../components/Pagination';

interface StockHistoryItem {
  id: string; type: string; quantity: number; previousAmount: number;
  newAmount: number; reason: string | null; createdAt: string;
  product: { id: string; name: string };
}

const Estoque: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const { products, isLoading, mutate: mutateProducts } = useProducts();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeTab, setActiveTab] = useState<'adjust' | 'history'>('adjust');
  const [history, setHistory] = useState<StockHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [productPerPage, setProductPerPage] = useState(20);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(20);

  // Modal state — each product opens its own modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'entry' | 'exit' | 'adjustment'>('entry');
  const [adjustValue, setAdjustValue] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const totalProductPages = Math.ceil(filteredProducts.length / productPerPage);
  const paginatedProducts = filteredProducts.slice((productPage - 1) * productPerPage, productPage * productPerPage);

  const filteredHistory = historySearch
    ? history.filter(h => h.product?.name?.toLowerCase().includes(historySearch.toLowerCase()))
    : history;
  const totalHistoryPages = Math.ceil(filteredHistory.length / historyPerPage);
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      if (historyFilter) params.set('type', historyFilter);
      const res = await api.get(`/stock-history?${params.toString()}`);
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab, historyFilter]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historyFilter, historySearch]);

  const openAdjustModal = (product: any) => {
    setModalProduct(product);
    setAdjustType('entry');
    setAdjustValue('');
    setAdjustReason('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setModalProduct(null); };

  const handleAdjust = async () => {
    if (!modalProduct) return;
    const value = parseInt(adjustValue);
    if (!value || value === 0) { toast('Informe um valor válido', 'warning'); return; }

    const adjustment = adjustType === 'exit' ? -Math.abs(value) : adjustType === 'entry' ? Math.abs(value) : value;
    setAdjusting(true);
    try {
      await api.post(`/products/${modalProduct.id}/stock`, {
        adjustment,
        reason: adjustReason || `Ajuste via painel de estoque`,
        type: adjustType,
      });
      toast(`Estoque de "${modalProduct.name}" atualizado!`, 'success');
      mutateProducts();
      closeModal();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao ajustar estoque', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const res = await api.post('/reports/pdf', { type: 'stock' }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-estoque-${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast('Relatório gerado!', 'success');
    } catch { toast('Erro ao gerar relatório', 'error'); }
    finally { setGeneratingPdf(false); }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'sale': return { label: 'Venda', color: 'text-red-500 bg-red-50' };
      case 'entry': return { label: 'Entrada', color: 'text-green-600 bg-green-50' };
      case 'exit': return { label: 'Saída', color: 'text-red-600 bg-red-50' };
      case 'adjustment': return { label: 'Ajuste', color: 'text-blue-500 bg-blue-50' };
      case 'return': return { label: 'Devolução', color: 'text-orange-500 bg-orange-50' };
      default: return { label: type, color: 'text-gray-500 bg-gray-50' };
    }
  };

  return (
    <AuthGuard>
      <DefaultPage title="Controle de Estoque">
        <Head><title>Estoque - Admin - Xananas&apos; Garden</title></Head>
        <ToastContainer />
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="flex flex-col lg:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-4 md:p-6 min-w-0 pb-20 lg:pb-6">
              {/* Tabs */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <button onClick={() => setActiveTab('adjust')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'adjust' ? 'btn-glass-pink-solid text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <Package size={16} className="inline mr-1" /> Produtos
                </button>
                <button onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'btn-glass-pink-solid text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <Clock size={16} className="inline mr-1" /> Histórico
                </button>
                <div className="flex-1" />
                <button onClick={handleGeneratePdf} disabled={generatingPdf}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50">
                  <FilePdf size={16} /> {generatingPdf ? 'Gerando...' : 'PDF'}
                </button>
              </div>

              {activeTab === 'adjust' ? (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-10">
                      <MagnifyingGlass size={16} className="text-gray-400" />
                      <input type="text" value={search} onChange={e => { setSearch(e.target.value); setProductPage(1); }}
                        className="flex-1 bg-transparent outline-none text-sm" placeholder="Buscar produto..." />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{filteredProducts.length} itens</span>
                    <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
                      <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-[#de818d]' : 'text-gray-400'}`}><GridFour size={18} /></button>
                      <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-[#de818d]' : 'text-gray-400'}`}><List size={18} /></button>
                    </div>
                  </div>

                  {/* Product list — click to open modal */}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {paginatedProducts.map((product: any) => (
                        <div key={product.id} onClick={() => openAdjustModal(product)}
                          className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#de818d]/30 hover:shadow-md transition-all">
                          <h3 className="font-medium text-gray-800 text-sm truncate">{product.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">{product.category?.name || '—'}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-600">{formatPrice(product.price || 0)}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(product.amount || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {product.amount || 0} un.
                            </span>
                          </div>
                          <button className="w-full mt-3 px-3 py-1.5 text-xs font-medium bg-[#de818d]/10 text-[#de818d] rounded-lg hover:bg-[#de818d]/20">
                            Ajustar
                          </button>
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-400 text-sm">Nenhum produto encontrado</div>
                      )}
                    </div>
                  ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Produto</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Categoria</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Preço</th>
                          <th className="text-left px-4 py-3 font-medium text-gray-500">Estoque</th>
                          <th className="text-right px-4 py-3 font-medium text-gray-500">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedProducts.map((product: any) => (
                          <tr key={product.id} onClick={() => openAdjustModal(product)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{product.category?.name || '—'}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs">{formatPrice(product.price || 0)}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(product.amount || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                {product.amount || 0} un.
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="px-3 py-1.5 text-xs font-medium bg-[#de818d]/10 text-[#de818d] rounded-lg hover:bg-[#de818d]/20">
                                Ajustar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                      <div className="text-center py-8 text-gray-400 text-sm">Nenhum produto encontrado</div>
                    )}
                  </div>
                  )}
                  <Pagination
                    page={productPage}
                    totalPages={totalProductPages}
                    totalItems={filteredProducts.length}
                    perPage={productPerPage}
                    onPageChange={setProductPage}
                    onPerPageChange={(v) => { setProductPerPage(v); setProductPage(1); }}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                      {[
                        { value: '', label: 'Todos' },
                        { value: 'sale', label: 'Vendas' },
                        { value: 'entry', label: 'Entradas' },
                        { value: 'exit', label: 'Saídas' },
                        { value: 'adjustment', label: 'Ajustes' },
                      ].map(opt => (
                        <button key={opt.value} onClick={() => setHistoryFilter(opt.value)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${historyFilter === opt.value ? 'bg-[#de818d] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                      <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input type="text" value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                        placeholder="Buscar por produto..."
                        className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#de818d]" />
                    </div>
                  </div>

                  {loadingHistory ? (
                    <div className="flex justify-center py-12"><AnimatedLogo size={40} /></div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Clock size={48} className="mx-auto mb-3 text-gray-200" />
                      <p>Nenhum registro de movimentação</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Produto</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Qtd</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Estoque</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Motivo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedHistory.map(item => {
                            const info = getTypeInfo(item.type);
                            return (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(item.createdAt).toLocaleString('pt-BR')}</td>
                                <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span></td>
                                <td className="px-4 py-3 text-gray-800 text-xs">{item.product.name}</td>
                                <td className="px-4 py-3 text-xs font-bold"><span className={item.quantity > 0 ? 'text-green-600' : 'text-red-600'}>{item.quantity > 0 ? '+' : ''}{item.quantity}</span></td>
                                <td className="px-4 py-3 text-xs text-gray-500">{item.previousAmount} → {item.newAmount}</td>
                                <td className="px-4 py-3 text-xs text-gray-400">{item.reason || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {!loadingHistory && filteredHistory.length > 0 && (
                    <Pagination
                      page={historyPage}
                      totalPages={totalHistoryPages}
                      totalItems={filteredHistory.length}
                      perPage={historyPerPage}
                      onPageChange={setHistoryPage}
                      onPerPageChange={(v) => { setHistoryPerPage(v); setHistoryPage(1); }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DefaultPage>

      {/* Stock Adjustment Modal */}
      {modalOpen && modalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ajustar Estoque</h2>
                <p className="text-sm text-gray-500">{modalProduct.name}</p>
              </div>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Current stock */}
              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">Estoque atual:</span>
                <span className="text-lg font-bold text-gray-800">{modalProduct.amount || 0} un.</span>
              </div>

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de movimentação</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: 'entry' as const, label: '+ Entrada', color: 'border-green-300 bg-green-50 text-green-700' },
                    { value: 'exit' as const, label: '- Saída', color: 'border-red-300 bg-red-50 text-red-700' },
                    { value: 'adjustment' as const, label: '↕ Ajuste', color: 'border-blue-300 bg-blue-50 text-blue-700' },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => setAdjustType(opt.value)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-all ${adjustType === opt.value ? opt.color : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input type="number" value={adjustValue} onChange={e => setAdjustValue(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="Ex: 10" min="1" autoFocus />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="Ex: Recebimento de fornecedor" />
              </div>

              {/* Preview */}
              {adjustValue && parseInt(adjustValue) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                  {adjustType === 'entry' && `+${adjustValue} → Novo estoque: ${(modalProduct.amount || 0) + parseInt(adjustValue)}`}
                  {adjustType === 'exit' && `-${adjustValue} → Novo estoque: ${Math.max(0, (modalProduct.amount || 0) - parseInt(adjustValue))}`}
                  {adjustType === 'adjustment' && `Ajuste para: ${adjustValue}`}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={handleAdjust} disabled={adjusting}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                  {adjusting ? <AnimatedLogo size={14} /> : null}
                  {adjusting ? 'Processando...' : 'Confirmar'}
                </button>
                <button onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
};

export default Estoque;
