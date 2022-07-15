import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { api } from '../../../../lib/api';
import { Shield, Plus, PencilSimple, Trash, Clock, Funnel, User, Package, ShoppingCart, FolderOpen, Megaphone, Ticket, X } from 'phosphor-react';

const fetcher = (url: string) => api.get(url).then(r => r.data);

const ACTION_ICONS: Record<string, any> = {
  create: Plus,
  update: PencilSimple,
  delete: Trash,
};

const ACTION_COLORS: Record<string, string> = {
  create: 'text-green-600 bg-green-50',
  update: 'text-blue-600 bg-blue-50',
  delete: 'text-red-600 bg-red-50',
};

const ENTITY_ICONS: Record<string, any> = {
  product: Package,
  sale: ShoppingCart,
  user: User,
  category: FolderOpen,
  campaign: Megaphone,
  coupon: Ticket,
};

const Auditoria: React.FC = () => {
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const params = new URLSearchParams();
  if (entity) params.set('entity', entity);
  if (action) params.set('action', action);
  params.set('page', String(page));
  params.set('limit', '30');

  const { data, mutate } = useSWR(`/audit?${params.toString()}`, fetcher, { refreshInterval: 30000 });
  const logs = data?.logs || [];
  const pagination = data?.pagination;

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const parseChanges = (changes?: string) => {
    if (!changes) return null;
    try { return JSON.parse(changes); } catch { return null; }
  };

  return (
    <AuthGuard>
      <Head><title>Auditoria - Admin - Xananas&apos; Garden</title></Head>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Shield size={24} className="text-[#de818d]" />
                <h1 className="text-2xl font-bold text-gray-800">Auditoria</h1>
                <span className="text-sm text-gray-400">({pagination?.total || 0} registros)</span>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Funnel size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-600">Filtros</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#de818d]">
                  <option value="">Todas as entidades</option>
                  <option value="product">Produtos</option>
                  <option value="sale">Vendas</option>
                  <option value="user">Usuários</option>
                  <option value="category">Categorias</option>
                  <option value="campaign">Campanhas</option>
                  <option value="coupon">Cupons</option>
                  <option value="supplier">Fornecedores</option>
                  <option value="purchase">Compras</option>
                  <option value="stock">Estoque</option>
                  <option value="cashflow">Caixa</option>
                  <option value="client">Clientes</option>
                  <option value="settings">Configurações</option>
                </select>
                <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#de818d]">
                  <option value="">Todas as ações</option>
                  <option value="create">Criação</option>
                  <option value="update">Atualização</option>
                  <option value="delete">Exclusão</option>
                </select>
                {(entity || action) && (
                  <button onClick={() => { setEntity(''); setAction(''); setPage(1); }}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-red-500 transition-colors">
                    <X size={12} /> Limpar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Timeline */}
            {logs.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Shield size={56} className="mx-auto mb-3 text-gray-200" />
                <p>Nenhum registro de auditoria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log: any) => {
                  const ActionIcon = ACTION_ICONS[log.action] || PencilSimple;
                  const EntityIcon = ENTITY_ICONS[log.entity] || Package;
                  const changes = parseChanges(log.changes);
                  return (
                    <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${ACTION_COLORS[log.action] || 'text-gray-600 bg-gray-50'}`}>
                          <ActionIcon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-800 capitalize">
                              {log.action === 'create' ? 'Criou' : log.action === 'update' ? 'Atualizou' : 'Excluiu'}
                            </span>
                            <EntityIcon size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600">{log.entity}</span>
                            {log.entityId && <span className="text-[10px] text-gray-400 font-mono">#{log.entityId.slice(0, 8)}</span>}
                          </div>
                          {log.userName && (
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                              <User size={10} /> {log.userName}
                            </p>
                          )}
                          {changes && Object.keys(changes).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                              {Object.entries(changes).map(([key, val]: [string, any]) => (
                                <div key={key} className="flex items-center gap-2">
                                  <span className="font-medium">{key}:</span>
                                  {val.old !== undefined && <span className="text-red-400 line-through">{String(val.old)?.slice(0, 50)}</span>}
                                  {val.old !== undefined && <span>→</span>}
                                  <span className="text-green-600">{String(val.new)?.slice(0, 50)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                          <Clock size={12} />
                          {new Date(log.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Anterior</button>
                <span className="text-sm text-gray-500">{page} / {pagination.totalPages}</span>
                <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Próxima</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Auditoria;
