import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import DefaultPage from '../../../components/DefaultPage';
import AdminHeader from '../../../components/AdminHeader';
import AdminSidebar from '../../../components/AdminSidebar';
import AuthGuard from '../../../components/AuthGuard';
import {
  Package, FolderPlus, Users, ChartLineUp, CurrencyCircleDollar, TrendUp,
  Warning, ShoppingCart, Truck, FileText, Clock, ArrowUp, ArrowDown,
  Wallet, X, CheckCircle, SignOut
} from 'phosphor-react';
import { api } from '../../../lib/api';
import { paymentTypeLabel } from '../../../lib/paymentType';
import { useToast } from '../../../components/Toast';
import useSWR from 'swr';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const fetcher = (url: string) => api.get(url).then(r => r.data);

interface Stats {
  products: number;
  categories: number;
  salesSummary: {
    totalSales: number;
    totalRevenue: number;
    todaySales: number;
    todayRevenue: number;
  };
}

const COLORS = ['#de818d', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

const AdminDashboard: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const [stats, setStats] = useState<Stats>({ products: 0, categories: 0, salesSummary: { totalSales: 0, totalRevenue: 0, todaySales: 0, todayRevenue: 0 } });

  const { data: lowStock } = useSWR<{ count: number; products: any[] }>(
    '/products/low-stock', fetcher, { refreshInterval: 30000 }
  );
  const { data: cashFlow } = useSWR<any>(
    '/cash-flow', fetcher
  );
  const { data: suppliers } = useSWR<any[]>(
    '/suppliers?active=true', fetcher
  );
  const { data: purchases } = useSWR<any[]>(
    '/purchases', fetcher
  );
  const { data: sales } = useSWR<any[]>(
    '/sales', fetcher
  );

  const [closingModal, setClosingModal] = useState(false);
  const [closingData, setClosingData] = useState<any>(null);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingCash, setClosingCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const [productsRes, categoriesRes, salesRes] = await Promise.all([
          fetch('/api/v1/products'),
          fetch('/api/v1/products-category'),
          fetch('/api/v1/sales/summary'),
        ]);
        const [products, categories, salesSummary] = await Promise.all([
          productsRes.json(),
          categoriesRes.json(),
          salesRes.json(),
        ]);
        setStats({
          products: Array.isArray(products) ? products.length : 0,
          categories: Array.isArray(categories) ? categories.length : 0,
          salesSummary,
        });
      } catch (err) {
        console.error('Failed to load stats', err);
      }
    }
    loadStats();
  }, []);

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // === CHART DATA ===

  // Daily revenue (last 7 days)
  const revenueChart = useMemo(() => {
    if (!sales) return [];
    const days: Record<string, { date: string; label: string; vendas: number; receita: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      days[key] = { date: key, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), vendas: 0, receita: 0 };
    }
    sales.forEach((s: any) => {
      const key = new Date(s.createdAt).toDateString();
      if (days[key]) {
        days[key].vendas += 1;
        days[key].receita += s.finalTotal || 0;
      }
    });
    return Object.values(days);
  }, [sales]);

  // Payment type distribution
  const paymentChart = useMemo(() => {
    if (!sales) return [];
    const counts: Record<string, number> = {};
    sales.forEach((s: any) => {
      const label = paymentTypeLabel(s.paymentType);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [sales]);

  // Top products
  const topProducts = useMemo(() => {
    if (!sales) return [];
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    sales.forEach((s: any) => {
      (s.items || []).forEach((item: any) => {
        const name = item.product?.name || 'Produto';
        if (!map[item.productId]) map[item.productId] = { name, qty: 0, revenue: 0 };
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.subtotal || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [sales]);

  // Today's profit
  const todaySales = (sales || []).filter((s: any) => {
    const d = new Date(s.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayRevenue = todaySales.reduce((sum: number, s: any) => sum + (s.finalTotal || 0), 0);
  const todayCost = todaySales.reduce((sum: number, s: any) => {
    return sum + (s.items || []).reduce((iSum: number, item: any) => {
      return iSum + (item.product?.costPrice || 0) * item.quantity;
    }, 0);
  }, 0);
  const todayProfit = todayRevenue - todayCost;
  const todayMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;

  const cf = cashFlow?.summary || { totalEntries: 0, totalExits: 0, balance: 0 };

  const [pendingRequests, setPendingRequests] = useState(0);
  useEffect(() => {
    api.get('/purchase-requests').then(r => {
      const pending = (r.data || []).filter((pr: any) => pr.status === 'pending');
      setPendingRequests(pending.length);
    }).catch(() => {});
  }, []);

  const openDailyClosing = () => {
    setOpeningBalance(String(cf.balance > 0 ? cf.balance : 0));
    setClosingCash('');
    setClosingNotes('');
    setClosingModal(true);
  };

  const handleDailyClosing = async () => {
    const cash = parseFloat(closingCash);
    if (isNaN(cash)) { toast('Informe o valor em caixa', 'warning'); return; }
    setIsClosing(true);
    try {
      await api.post('/cash-flow', {
        type: 'closing',
        description: `Fechamento diário — Caixa: ${formatBRL(cash)}`,
        amount: cash,
      });
      toast('Fechamento diário registrado!', 'success');
      setClosingModal(false);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao fechar', 'error');
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <AuthGuard>
      <DefaultPage title="Dashboard">
        <ToastContainer />
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="flex flex-col lg:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <button onClick={openDailyClosing}
                  className="flex items-center gap-2 px-4 py-2 btn-glass-pink-solid text-white rounded-lg text-sm font-medium">
                  <SignOut size={16} /> Fechamento Diário
                </button>
              </div>

              {/* Low Stock Alert */}
              {lowStock && lowStock.count > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Warning size={20} className="text-orange-500" />
                    <h3 className="font-semibold text-orange-700">Alerta de Estoque Baixo</h3>
                    <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                      {lowStock.count}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {lowStock.products.map((p: any) => (
                      <Link key={p.id} href="/admin/dashboard/estoque"
                        className="flex items-center gap-2 bg-white rounded-lg p-2 text-sm hover:shadow-sm transition-all">
                        <Package size={14} className="text-orange-500" />
                        <span className="font-medium text-gray-700">{p.name}</span>
                        <span className="text-orange-600 ml-auto">{p.amount || 0}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <Package size={24} className="text-[#de818d]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Produtos</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.products}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CurrencyCircleDollar size={24} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Vendas Hoje</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.salesSummary.todaySales}</p>
                      <p className="text-xs text-green-600">{formatBRL(stats.salesSummary.todayRevenue)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <TrendUp size={24} className="text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lucro Hoje</p>
                      <p className={`text-2xl font-bold ${todayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatBRL(todayProfit)}
                      </p>
                      <p className="text-xs text-gray-400">Margem: {todayMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Wallet size={24} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Saldo em Caixa</p>
                      <p className={`text-2xl font-bold ${cf.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatBRL(cf.balance)}
                      </p>
                      <p className="text-xs text-gray-400">Total: {formatBRL(stats.salesSummary.totalRevenue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Revenue Line Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ChartLineUp size={18} className="text-[#de818d]" />
                    <h3 className="font-semibold text-gray-800">Receita — Últimos 7 dias</h3>
                  </div>
                  {revenueChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `R$${v}`} />
                        <Tooltip
                          formatter={(value) => formatBRL(Number(value))}
                          labelFormatter={(label) => `Dia: ${label}`}
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                        />
                        <Line type="monotone" dataKey="receita" stroke="#de818d" strokeWidth={2.5} dot={{ r: 4, fill: '#de818d' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="vendas" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6' }} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-60 text-gray-400 text-sm">Sem dados de vendas</div>
                  )}
                </div>

                {/* Payment Pie Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <CurrencyCircleDollar size={18} className="text-green-500" />
                    <h3 className="font-semibold text-gray-800">Forma de Pagamento</h3>
                  </div>
                  {paymentChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={paymentChart} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value"                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                          {paymentChart.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} vendas`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-60 text-gray-400 text-sm">Sem dados</div>
                  )}
                </div>
              </div>

              {/* Top Products Bar Chart */}
              {topProducts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendUp size={18} className="text-purple-500" />
                    <h3 className="font-semibold text-gray-800">Produtos Mais Vendidos</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `R$${v}`} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#9ca3af" width={120} />
                      <Tooltip formatter={(value) => formatBRL(Number(value))} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <Bar dataKey="revenue" fill="#de818d" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Financial summary row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Entradas (Hoje)</span>
                    <ArrowUp size={16} className="text-green-500" />
                  </div>
                  <p className="text-lg font-bold text-green-600">{formatBRL(cf.totalEntries)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Saídas (Hoje)</span>
                    <ArrowDown size={16} className="text-red-500" />
                  </div>
                  <p className="text-lg font-bold text-red-600">{formatBRL(cf.totalExits)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Solicitações Pendentes</span>
                    <ShoppingCart size={16} className="text-orange-500" />
                  </div>
                  <p className="text-lg font-bold text-orange-600">{pendingRequests}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/dashboard/produtos" className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all block">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Cadastrar Produto</h3>
                  <p className="text-gray-500 text-sm">Adicione novos produtos ao catálogo com imagens e preços.</p>
                </Link>
                <Link href="/admin/dashboard/compras" className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all block">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Registrar Compra</h3>
                  <p className="text-gray-500 text-sm">Registre compras para atualizar estoque ou manter histórico.</p>
                </Link>
                <Link href="/admin/dashboard/fornecedores" className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all block">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Fornecedores</h3>
                  <p className="text-gray-500 text-sm">Gerencie fornecedores e vincule preços de compra.</p>
                </Link>
                <Link href="/admin/dashboard/pdv" className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all block">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Abrir PDV</h3>
                  <p className="text-gray-500 text-sm">Inicie uma nova sessão de vendas.</p>
                </Link>
                <Link href="/admin/dashboard/relatorios" className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all block">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatórios</h3>
                  <p className="text-gray-500 text-sm">Gere relatórios gerenciais e exporte em PDF.</p>
                </Link>
                <Link href="/admin/dashboard/estoque" className="glass-card rounded-xl p-5 cursor-pointer hover:shadow-md transition-all block">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Controle de Estoque</h3>
                  <p className="text-gray-500 text-sm">Ajuste entradas, saídas e visualize o histórico.</p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Closing Modal */}
        {closingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Fechamento Diário</h2>
                <button onClick={() => setClosingModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Saldo em caixa:</span>
                    <span className="font-semibold text-blue-600">{formatBRL(cf.balance)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Valor contado em caixa</label>
                  <input type="number" step="0.01" value={closingCash} onChange={e => setClosingCash(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="R$ 0,00" />
                </div>
                {closingCash && parseFloat(closingCash) !== cf.balance && (
                  <div className={`text-sm p-2 rounded-lg ${parseFloat(closingCash) > cf.balance ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                    {parseFloat(closingCash) > cf.balance
                      ? `Sobra: ${formatBRL(parseFloat(closingCash) - cf.balance)}`
                      : `Falta: ${formatBRL(cf.balance - parseFloat(closingCash))}`
                    }
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
                  <textarea value={closingNotes} onChange={e => setClosingNotes(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-16 resize-none" placeholder="Notas..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-4 border-t">
                <button onClick={() => setClosingModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button onClick={handleDailyClosing} disabled={isClosing}
                  className="px-4 py-2 text-sm btn-glass-pink-solid text-white rounded-lg disabled:opacity-50">
                  {isClosing ? 'Salvando...' : 'Confirmar Fechamento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DefaultPage>
    </AuthGuard>
  );
};

export default AdminDashboard;
