import React, { useState } from 'react';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../lib/api';
import { normalizeBrazilPhone } from '../../../../lib/settings';
import useSWR from 'swr';
import {
  ShoppingCart, CheckCircle, XCircle, Truck, Eye, X,
  User, Phone, MapPin, Envelope, UserPlus, GridFour, List
} from 'phosphor-react';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import Pagination from '../../../../components/Pagination';
import SearchInput from '../../../../components/SearchInput';

interface PurchaseRequestItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: { name: string; slug: string };
}

interface PurchaseRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  customerStreet?: string;
  customerNumber?: string;
  customerNeighborhood?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerPhoneCode?: string;
  customerNotes?: string;
  status: string;
  total?: number;
  notes?: string;
  clientId?: string;
  client?: { name: string; phone: string };
  createdAt: string;
  items: PurchaseRequestItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Aprovada', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-700' },
  delivered: { label: 'Entregue', color: 'bg-blue-100 text-blue-700' },
};

const Solicitacoes: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const { data: requests = [], mutate, isLoading } = useSWR<PurchaseRequest[]>(
    '/purchase-requests',
    (url: string) => api.get(url).then(r => r.data),
    { revalidateOnFocus: true, revalidateOnReconnect: true }
  );

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.patch('/purchase-requests', { id, status });
      toast(`Solicitação ${STATUS_MAP[status]?.label.toLowerCase()}!`, 'success');
      mutate();
      if (selectedRequest?.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status } : null);
      }
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao atualizar', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const convertToClient = async (id: string) => {
    try {
      const res = await api.patch('/purchase-requests', { id, convertToClient: true });
      toast(`Cliente criado: ${res.data.client.name}!`, 'success');
      mutate();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao criar cliente', 'error');
    }
  };

  const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);
  const searched = filtered.filter(r =>
    !searchTerm ||
    r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customerPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(searched.length / perPage);
  const paginated = searched.slice((currentPage - 1) * perPage, currentPage * perPage);
  const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };
  const counts: Record<string, number> = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    delivered: requests.filter(r => r.status === 'delivered').length,
  };

  const formatPrice = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const buildWaUrl = (phone: string, message: string) => {
    const clean = normalizeBrazilPhone(phone);
    const base = clean ? `https://wa.me/${clean}` : 'https://wa.me/';
    const params = new URLSearchParams({ text: message });
    return `${base}?${params.toString()}`;
  };

  const formatAddress = (req: PurchaseRequest) => {
    if (req.customerStreet || req.customerCity) {
      const parts = [
        req.customerStreet,
        req.customerNumber,
        req.customerNeighborhood,
        req.customerCity,
        req.customerState,
        req.customerZip ? `CEP: ${req.customerZip}` : '',
      ].filter(Boolean);
      return parts.join(', ');
    }
    return req.customerAddress;
  };

  return (
    <AuthGuard>
      <Head><title>Solicitações - Admin - Xananas&apos; Garden</title></Head>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 min-w-0 pb-20 lg:pb-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} className="text-[#de818d]" />
                <h1 className="text-2xl font-bold text-gray-800">Solicitações de Compra</h1>
                <span className="text-sm text-gray-400">({requests.length})</span>
              </div>
              <div className="flex bg-white border border-gray-200 rounded-lg p-0.5">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-[#de818d]' : 'text-gray-400'}`}><GridFour size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-[#de818d]' : 'text-gray-400'}`}><List size={18} /></button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-6 overflow-x-auto">
              {(['all', 'pending', 'approved', 'rejected', 'delivered'] as const).map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === s ? 'bg-[#de818d] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {s === 'all' ? 'Todas' : STATUS_MAP[s]?.label} ({counts[s] || 0})
                </button>
              ))}
            </div>

            <div className="mb-6">
              <SearchInput value={searchTerm} onChange={handleSearch} placeholder="Buscar por nome, telefone ou email..." className="max-w-md" />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><AnimatedLogo size={48} /></div>
            ) : searched.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <ShoppingCart size={56} className="mx-auto mb-3 text-gray-200" />
                <p>Nenhuma solicitação encontrada</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.map(req => {
                  const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.pending;
                  return (
                    <div key={req.id} onClick={() => setSelectedRequest(req)}
                      className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#de818d]/30 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="font-semibold text-gray-800 truncate">{req.customerName}</span>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} />{req.customerPhone}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <span>{req.items.length} itens</span>
                        {req.total && <span className="font-bold text-[#de818d]">{formatPrice(req.total)}</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(req.createdAt).toLocaleDateString('pt-BR')}</p>
                      <div className="flex gap-1 mt-3" onClick={e => e.stopPropagation()}>
                        {req.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(req.id, 'approved')} disabled={updatingId === req.id}
                              className="flex-1 p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Aprovar">
                              <CheckCircle size={14} className="mx-auto" />
                            </button>
                            <button onClick={() => updateStatus(req.id, 'rejected')} disabled={updatingId === req.id}
                              className="flex-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Rejeitar">
                              <XCircle size={14} className="mx-auto" />
                            </button>
                          </>
                        )}
                        {req.status === 'approved' && (
                          <button onClick={() => updateStatus(req.id, 'delivered')} disabled={updatingId === req.id}
                            className="flex-1 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Entregue">
                            <Truck size={14} className="mx-auto" />
                          </button>
                        )}
                        <button onClick={() => setSelectedRequest(req)}
                          className="flex-1 p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg transition-colors">
                          <Eye size={14} className="mx-auto" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {paginated.map(req => {
                  const statusInfo = STATUS_MAP[req.status] || STATUS_MAP.pending;
                  return (
                    <div key={req.id} onClick={() => setSelectedRequest(req)}
                      className="bg-white rounded-xl border border-gray-100 p-4 hover:border-[#de818d]/30 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User size={14} className="text-gray-400" />
                            <span className="font-semibold text-gray-800">{req.customerName}</span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {req.client && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                Cliente
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Phone size={10} />{req.customerPhone}</span>
                            {req.customerEmail && (
                              <span className="flex items-center gap-1"><Envelope size={10} />{req.customerEmail}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1 flex items-center gap-1">
                            <MapPin size={10} className="flex-shrink-0" /> {formatAddress(req)}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{req.items.length} itens</span>
                            {req.total && <span className="font-bold text-[#de818d]">{formatPrice(req.total)}</span>}
                            <span>{new Date(req.createdAt).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          {req.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(req.id, 'approved')} disabled={updatingId === req.id}
                                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors" title="Aprovar">
                                <CheckCircle size={16} />
                              </button>
                              <button onClick={() => updateStatus(req.id, 'rejected')} disabled={updatingId === req.id}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Rejeitar">
                                <XCircle size={16} />
                              </button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <button onClick={() => updateStatus(req.id, 'delivered')} disabled={updatingId === req.id}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Entregue">
                              <Truck size={16} />
                            </button>
                          )}
                          <button onClick={() => setSelectedRequest(req)}
                            className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg transition-colors">
                            <Eye size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={searched.length}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">Detalhes da Solicitação</h2>
              <button onClick={() => setSelectedRequest(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 text-xs">Nome</span>
                  <p className="font-medium">{selectedRequest.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">Telefone</span>
                  <p className="font-medium">{selectedRequest.customerPhone}</p>
                </div>
                {selectedRequest.customerEmail && (
                  <div className="col-span-2">
                    <span className="text-gray-500 text-xs">Email</span>
                    <p className="font-medium">{selectedRequest.customerEmail}</p>
                  </div>
                )}
              </div>

              {/* Structured Address */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <MapPin size={12} /> Endereço de entrega
                </div>
                {(selectedRequest.customerStreet || selectedRequest.customerCity) ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedRequest.customerStreet && (
                      <div className="col-span-2">
                        <span className="text-gray-400 text-[10px]">Rua</span>
                        <p className="font-medium">{selectedRequest.customerStreet}{selectedRequest.customerNumber ? `, ${selectedRequest.customerNumber}` : ''}</p>
                      </div>
                    )}
                    {selectedRequest.customerNeighborhood && (
                      <div>
                        <span className="text-gray-400 text-[10px]">Bairro</span>
                        <p className="font-medium">{selectedRequest.customerNeighborhood}</p>
                      </div>
                    )}
                    {selectedRequest.customerCity && (
                      <div>
                        <span className="text-gray-400 text-[10px]">Cidade/UF</span>
                        <p className="font-medium">{selectedRequest.customerCity}/{selectedRequest.customerState}</p>
                      </div>
                    )}
                    {selectedRequest.customerZip && (
                      <div>
                        <span className="text-gray-400 text-[10px]">CEP</span>
                        <p className="font-medium">{selectedRequest.customerZip}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="font-medium">{selectedRequest.customerAddress}</p>
                )}
              </div>

              {selectedRequest.customerNotes && (
                <div className="text-sm">
                  <span className="text-gray-500 text-xs">Observações</span>
                  <p className="font-medium">{selectedRequest.customerNotes}</p>
                </div>
              )}

              {/* Items */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Itens</h3>
                <div className="space-y-2">
                  {selectedRequest.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-gray-800">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{item.quantity}x {formatPrice(item.unitPrice)}</p>
                      </div>
                      <span className="font-bold text-[#de818d]">{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                {selectedRequest.total && (
                  <div className="flex justify-between text-lg font-bold text-gray-800 mt-3 pt-3 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-[#de818d]">{formatPrice(selectedRequest.total)}</span>
                  </div>
                )}
              </div>

              {selectedRequest.status === 'delivered' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                  ✅ Esta solicitação já foi convertida em registro do PDV.
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                {/* Convert to Client */}
                {!selectedRequest.clientId && (
                  <button onClick={() => convertToClient(selectedRequest.id)}
                    className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                    <UserPlus size={16} /> Transformar em Cliente
                  </button>
                )}
                {selectedRequest.clientId && (
                  <div className="text-xs text-purple-600 bg-purple-50 rounded-lg p-2 text-center">
                    ✅ Vinculado ao cliente
                  </div>
                )}

                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(selectedRequest.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 rounded-lg text-sm">
                      <CheckCircle size={16} /> Aprovar
                    </button>
                    <button onClick={() => updateStatus(selectedRequest.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg text-sm">
                      <XCircle size={16} /> Rejeitar
                    </button>
                  </div>
                )}
                {selectedRequest.status === 'approved' && (
                  <button onClick={() => updateStatus(selectedRequest.id, 'delivered')}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg text-sm">
                    <Truck size={16} /> Marcar Entregue
                  </button>
                )}

                <a href={buildWaUrl(selectedRequest.customerPhone, `Olá ${selectedRequest.customerName}! Sua solicitação foi recebida. Total: ${selectedRequest.total ? formatPrice(selectedRequest.total) : 'a definir'}. Aguardamos seu contato!`)}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                  Contatar via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
};

export default Solicitacoes;
