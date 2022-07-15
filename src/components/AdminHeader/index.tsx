import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { UserCircle, Bell, Warning, ShoppingCart, CurrencyCircleDollar, Package, Clock, X, Eye, MagnifyingGlass } from 'phosphor-react';
import useSWR from 'swr';
import { api } from '../../lib/api';
import { paymentTypeLabel } from '../../lib/paymentType';

const fetcher = (url: string) => api.get(url).then(r => r.data);

interface Notification {
  id: string;
  type: 'stock' | 'request' | 'sale' | 'general';
  title: string;
  message: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  link: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

const AdminHeader: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [detailNotification, setDetailNotification] = useState<Notification | null>(null);
  const [time, setTime] = useState('');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/admin/dashboard/produtos?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  // Fetch all notification sources
  const { data: lowStock } = useSWR<{ count: number; products: any[] }>(
    '/products/low-stock', fetcher, { refreshInterval: 30000 }
  );
  const { data: purchaseRequests } = useSWR<any[]>(
    '/purchase-requests', fetcher, { refreshInterval: 30000 }
  );
  const { data: sales } = useSWR<any[]>(
    '/sales', fetcher, { refreshInterval: 60000 }
  );

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load read state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('xananas_notif_read');
      if (saved) setReadIds(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const markAsRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    localStorage.setItem('xananas_notif_read', JSON.stringify(Array.from(next)));
  };

  // Build notifications from all sources
  const notifications = useMemo(() => {
    const items: Notification[] = [];

    // Low stock alerts
    if (lowStock?.products) {
      lowStock.products.forEach((p: any) => {
        items.push({
          id: `stock-${p.id}`,
          type: 'stock',
          title: 'Estoque Baixo',
          message: `${p.name} — ${p.amount || 0} un. (mín: ${p.lowStockThreshold || 5})`,
          icon: Warning,
          iconColor: 'text-orange-500',
          iconBg: 'bg-orange-50',
          link: '/admin/dashboard/estoque',
          timestamp: new Date().toISOString(),
          read: readIds.has(`stock-${p.id}`),
          data: p,
        });
      });
    }

    // Pending purchase requests
    if (Array.isArray(purchaseRequests)) {
      const pending = purchaseRequests.filter((pr: any) => pr.status === 'pending');
      pending.forEach((pr: any) => {
        items.push({
          id: `request-${pr.id}`,
          type: 'request',
          title: 'Nova Solicitação de Compra',
          message: `${pr.customerName} — ${pr.items?.length || 0} itens${pr.total ? ` — R$ ${pr.total.toFixed(2)}` : ''}`,
          icon: ShoppingCart,
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-50',
          link: '/admin/dashboard/solicitacoes',
          timestamp: pr.createdAt,
          read: readIds.has(`request-${pr.id}`),
          data: pr,
        });
      });
    }

    // Recent sales (last hour)
    if (Array.isArray(sales)) {
      const recentSales = sales.filter((s: any) => {
        const diff = Date.now() - new Date(s.createdAt).getTime();
        return diff < 3600000; // last hour
      });
      recentSales.forEach((s: any) => {
        items.push({
          id: `sale-${s.id}`,
          type: 'sale',
          title: 'Nova Venda',
          message: `${s.client?.name || 'Cliente avulso'} — R$ ${(s.finalTotal || 0).toFixed(2)} (${paymentTypeLabel(s.paymentType)})`,
          icon: CurrencyCircleDollar,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-50',
          link: '/admin/dashboard/pdv',
          timestamp: s.createdAt,
          read: readIds.has(`sale-${s.id}`),
          data: s,
        });
      });
    }

    // Sort by timestamp desc
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items;
  }, [lowStock, purchaseRequests, sales, readIds]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    setDetailNotification(notif);
    setShowNotifications(false);
  };

  const handleNotificationLink = (notif: Notification) => {
    markAsRead(notif.id);
    setDetailNotification(null);
    router.push(notif.link);
  };

  const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="flex bg-white border-b border-gray-200 justify-between h-14 items-center px-4 md:px-6 gap-4">
      <div className="flex-shrink-0">
        <Link href="/admin/dashboard" className="font-gloria text-[#de818d] text-lg cursor-pointer">
          Xananas&apos; Garden
        </Link>
      </div>

      <form onSubmit={handleSearchSubmit} className="hidden sm:flex flex-1 max-w-md mx-auto">
        <div className="relative w-full">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#de818d] focus:border-transparent transition-colors"
          />
        </div>
      </form>

      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="hidden md:inline text-xs text-gray-400">{time}</span>

        {/* Notification bell */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={20} className={unreadCount > 0 ? 'text-[#de818d]' : 'text-gray-400'} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Notificações</h3>
                <span className="text-[10px] text-gray-400">{notifications.length} total · {unreadCount} novas</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    ✅ Tudo em ordem!
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifications.map(notif => {
                      const Icon = notif.icon;
                      return (
                        <button key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${notif.read ? 'hover:bg-gray-50' : 'hover:bg-gray-50 bg-blue-50/30'}`}>
                          <div className={`p-1.5 rounded-lg flex-shrink-0 ${notif.iconBg}`}>
                            <Icon size={14} className={notif.iconColor} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-medium truncate ${notif.read ? 'text-gray-600' : 'text-gray-800'}`}>
                                {notif.title}
                              </p>
                              {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-[#de818d] flex-shrink-0" />}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-gray-300 mt-0.5">{formatTime(notif.timestamp)}</p>
                          </div>
                          <Eye size={12} className="text-gray-300 flex-shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-gray-100 flex gap-2">
                  <button onClick={() => {
                    notifications.forEach(n => markAsRead(n.id));
                    setShowNotifications(false);
                  }} className="flex-1 text-center text-[11px] text-gray-400 hover:text-gray-600 py-1 transition-colors">
                    Marcar todas como lidas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <Link href="/" className="hidden sm:inline text-sm text-gray-500 hover:text-[#de818d] transition-colors" target="_blank">
          Ver Loja ↗
        </Link>

        <Link href="/admin/dashboard/perfil" className="flex items-center gap-1.5 group">
          {user?.avatar && !user.avatar.includes('github') ? (
            <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200 group-hover:border-[#de818d] transition-colors" />
          ) : (
            <UserCircle size={20} className="text-gray-400 group-hover:text-[#de818d] transition-colors" />
          )}
          <span className="hidden md:inline text-sm text-gray-600 group-hover:text-[#de818d] transition-colors">
            {user?.name || 'Usuário'}
          </span>
        </Link>

        <button onClick={logout}
          className="text-sm text-gray-400 hover:text-red-500 transition-colors">
          Sair
        </button>
      </div>

      {/* Detail modal */}
      {detailNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailNotification(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${detailNotification.iconBg}`}>
                  {React.createElement(detailNotification.icon, { size: 18, className: detailNotification.iconColor })}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{detailNotification.title}</h3>
                  <p className="text-xs text-gray-400">{formatTime(detailNotification.timestamp)}</p>
                </div>
              </div>
              <button onClick={() => setDetailNotification(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* Stock detail */}
              {detailNotification.type === 'stock' && detailNotification.data && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Package size={24} className="text-orange-400" />
                    <div>
                      <p className="font-semibold text-gray-800">{detailNotification.data.name}</p>
                      <p className="text-sm text-gray-500">{detailNotification.data.category?.name || 'Sem categoria'}</p>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estoque atual:</span>
                      <span className="font-bold text-orange-600">{detailNotification.data.amount || 0} unidades</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Mínimo:</span>
                      <span className="text-gray-700">{detailNotification.data.lowStockThreshold || 5} unidades</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Faltam:</span>
                      <span className="font-bold text-red-600">{Math.max(0, (detailNotification.data.lowStockThreshold || 5) - (detailNotification.data.amount || 0))} unidades</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase request detail */}
              {detailNotification.type === 'request' && detailNotification.data && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <ShoppingCart size={24} className="text-blue-400" />
                    <div>
                      <p className="font-semibold text-gray-800">{detailNotification.data.customerName}</p>
                      <p className="text-sm text-gray-500">{detailNotification.data.customerEmail || 'Sem email'}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Telefone:</span>
                      <span className="text-gray-700">{detailNotification.data.customerPhone || '—'}</span>
                    </div>
                    {detailNotification.data.customerAddress && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Endereço:</span>
                        <span className="text-gray-700 text-right max-w-[200px]">{detailNotification.data.customerAddress}</span>
                      </div>
                    )}
                    {detailNotification.data.total && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-blue-600">R$ {detailNotification.data.total.toFixed(2)}</span>
                      </div>
                    )}
                    {detailNotification.data.customerNotes && (
                      <div className="text-sm">
                        <span className="text-gray-600">Obs:</span>
                        <p className="text-gray-700 mt-1">{detailNotification.data.customerNotes}</p>
                      </div>
                    )}
                  </div>
                  {detailNotification.data.items?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Itens ({detailNotification.data.items.length})</p>
                      <div className="space-y-1">
                        {detailNotification.data.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-700">{item.quantity}x {item.product?.name || 'Produto'}</span>
                            <span className="text-gray-600">R$ {(item.subtotal || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sale detail */}
              {detailNotification.type === 'sale' && detailNotification.data && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <CurrencyCircleDollar size={24} className="text-green-400" />
                    <div>
                      <p className="font-semibold text-gray-800">Venda #{detailNotification.data.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">{detailNotification.data.client?.name || 'Cliente avulso'}</p>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pagamento:</span>
                      <span className="text-gray-700">
                        {detailNotification.data.paymentType === 'money' ? '💵 ' : detailNotification.data.paymentType === 'card' ? '💳 ' : detailNotification.data.paymentType === 'pix' ? '📱 ' : '🔘 '}
                        {paymentTypeLabel(detailNotification.data.paymentType)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-700">R$ {(detailNotification.data.total || 0).toFixed(2)}</span>
                    </div>
                    {detailNotification.data.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Desconto:</span>
                        <span className="text-green-600">-R$ {detailNotification.data.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold border-t border-green-200 pt-2">
                      <span className="text-gray-800">Total:</span>
                      <span className="text-green-700">R$ {(detailNotification.data.finalTotal || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-100">
              <button onClick={() => handleNotificationLink(detailNotification)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                <Eye size={16} /> Ver Detalhes
              </button>
              <button onClick={() => setDetailNotification(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeader;
