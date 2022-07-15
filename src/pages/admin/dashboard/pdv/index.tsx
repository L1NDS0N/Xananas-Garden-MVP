import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import DefaultPage from '../../../../components/DefaultPage';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../lib/api';
import {
  Plus, Minus, Trash, ShoppingCart, CreditCard, Money, Bank, DotsThreeCircle,
  CheckCircle, Package, MagnifyingGlass, FilePdf, Clock, ArrowUp,
  ArrowDown, SignOut, X, Wallet, CaretRight, CaretLeft, Truck, Storefront, Ticket
} from 'phosphor-react';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import { useProducts } from '../../../../hooks/useSWRProducts';
import { useCategories } from '../../../../hooks/useSWRCategories';
import { useAuth } from '../../../../hooks/useAuth';
import { paymentTypeLabel } from '../../../../lib/paymentType';
import { normalizeBrazilPhone } from '../../../../lib/settings';
import useSWR, { useSWRConfig } from 'swr';

const fetcher = (url: string) => api.get(url).then(r => r.data);

const PAYMENT_METHOD_ICONS: Record<string, typeof Money> = {
  money: Money, card: CreditCard, pix: Bank, other: DotsThreeCircle,
};

function formatAdjustmentHint(m: { adjustmentType: 'discount' | 'surcharge' | null; adjustmentValueType: 'percentage' | 'fixed' | null; adjustmentValue: number | null }): string {
  if (!m.adjustmentType || !m.adjustmentValue) return '';
  const label = m.adjustmentType === 'discount' ? 'Desconto' : 'Acréscimo';
  const value = m.adjustmentValueType === 'percentage' ? `${m.adjustmentValue}%` : `R$ ${m.adjustmentValue.toFixed(2)}`;
  return `${label} automático: ${value}`;
}

interface PaymentMethod {
  id: string;
  key: string;
  name: string;
  active: boolean;
  maxInstallments: number;
  adjustmentType: 'discount' | 'surcharge' | null;
  adjustmentValueType: 'percentage' | 'fixed' | null;
  adjustmentValue: number | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  amount: number;
  published?: boolean;
  categoryId: string;
  category: { id: string; name: string };
  categories?: { id: string; name: string }[];
  paymentMethods?: { id: string }[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Client {
  id: string;
  name: string;
  phone?: string | null;
  whatsapp?: string | null;
}

interface CashFlowItem {
  id: string;
  type: string;
  description: string;
  amount: number;
  referenceId?: string | null;
  createdAt: string;
  user?: { name: string };
}

const PDV: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const { products: allProducts, isLoading } = useProducts();
  const { categories } = useCategories();
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentType, setPaymentType] = useState('money');
  const [discount, setDiscount] = useState(0);
  /** Manual override for the final charged amount (negotiated price) — raw string, empty = not overridden */
  const [negotiatedTotal, setNegotiatedTotal] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'sale' | 'cashflow' | 'sales' | 'reports'>('sale');
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [countedAmount, setCountedAmount] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState<{ id: string; total: number } | null>(null);
  const [mobileStep, setMobileStep] = useState<'products' | 'cart' | 'payment'>('products');

  const { mutate } = useSWRConfig();

  const { data: clients = [] } = useSWR<Client[]>('/clients', fetcher);
  const { data: paymentMethodsRaw = [] } = useSWR<PaymentMethod[]>('/payment-methods', fetcher);
  const allPaymentMethods = React.useMemo(() => paymentMethodsRaw.filter(m => m.active), [paymentMethodsRaw]);
  // Includes inactive/since-deleted methods too, so historical sales still resolve to their real name
  const paymentMethodLabels = React.useMemo(() => {
    const map: Record<string, string> = {};
    paymentMethodsRaw.forEach(m => { map[m.key] = m.name; });
    return map;
  }, [paymentMethodsRaw]);

  // Only fetched while the corresponding tab is active — switching tabs fetches fresh automatically
  const { data: cashFlowData, mutate: mutateCashFlow, isLoading: loadingCashFlow } = useSWR(
    activeTab === 'cashflow' ? '/cash-flow' : null, fetcher
  );
  const cashFlows: CashFlowItem[] = cashFlowData?.flows || [];
  const cashSummary = cashFlowData?.summary || { totalEntries: 0, totalExits: 0, balance: 0 };

  const { data: salesList = [], mutate: mutateSales, isLoading: loadingSales } = useSWR<any[]>(
    activeTab === 'sales' ? '/sales' : null, fetcher
  );

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  const filteredClients = React.useMemo(() => {
    if (!clientSearch.trim()) return clients.slice(0, 30);
    const term = clientSearch.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term) ||
      c.whatsapp?.toLowerCase().includes(term)
    ).slice(0, 30);
  }, [clients, clientSearch]);

  // Products available = published products, minus items in cart (respecting stock)
  const availableProducts = allProducts.filter((p: any) => {
    if (p.published === false) return false;
    if (p.amount <= 0) return false;
    const inCart = cart.find(c => c.product.id === p.id);
    const remainingStock = inCart ? p.amount - inCart.quantity : p.amount;
    return remainingStock > 0;
  });

  const filteredProducts = availableProducts.filter((p: any) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategoryId || (p.categories?.length ? p.categories : [p.category]).some((c: any) => c?.id === selectedCategoryId);
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      const totalInCart = existing.quantity + 1;
      if (totalInCart > product.amount) {
        toast('Estoque insuficiente', 'warning');
        return;
      }
      setCart(prev => prev.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.amount < 1) {
        toast('Estoque insuficiente', 'warning');
        return;
      }
      setCart(prev => [...prev, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.product.id === productId);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter(i => i.product.id !== productId);
      const product = allProducts.find((p: any) => p.id === productId) as Product | undefined;
      if (product && newQty > product.amount) {
        toast('Estoque insuficiente', 'warning');
        return prev;
      }
      return prev.map(i => i.product.id === productId ? { ...i, quantity: newQty } : i);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const isNegotiated = negotiatedTotal !== '' && !isNaN(parseFloat(negotiatedTotal));
  // Editing the final value directly re-derives the discount (or surcharge, if negative) needed to reach it —
  // the sale record still only stores total/discount/finalTotal, same as a manually-typed discount would.
  const effectiveDiscount = isNegotiated ? total - parseFloat(negotiatedTotal) : discount;

  // Payment methods available for the current cart — the intersection of every item's
  // allowed methods. A product with none configured accepts every active method (legacy/unrestricted).
  const availablePaymentMethods = React.useMemo(() => {
    let allowedIds: Set<string> | null = null;
    for (const item of cart) {
      const productMethods = item.product.paymentMethods;
      if (!productMethods || productMethods.length === 0) continue;
      const ids: Set<string> = new Set(productMethods.map(m => m.id));
      if (!allowedIds) { allowedIds = ids; continue; }
      const prev: Set<string> = allowedIds;
      const intersected: Set<string> = new Set<string>();
      prev.forEach((id: string) => { if (ids.has(id)) intersected.add(id); });
      allowedIds = intersected;
    }
    if (!allowedIds) return allPaymentMethods;
    const set = allowedIds;
    return allPaymentMethods.filter(m => set.has(m.id));
  }, [cart, allPaymentMethods]);

  // Keep the selected payment type valid as the cart (and its allowed methods) change
  useEffect(() => {
    if (availablePaymentMethods.length === 0) return;
    if (!availablePaymentMethods.some(m => m.key === paymentType)) {
      setPaymentType(availablePaymentMethods[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePaymentMethods]);

  const selectedPaymentMethod = availablePaymentMethods.find(m => m.key === paymentType);
  // Automatic discount/surcharge tied to the chosen payment method, applied on top of the subtotal already net of coupon/manual/negotiated discount
  const paymentAdjustment = (() => {
    if (!selectedPaymentMethod?.adjustmentType || !selectedPaymentMethod.adjustmentValue) return 0;
    const base = total - effectiveDiscount;
    const raw = selectedPaymentMethod.adjustmentValueType === 'percentage'
      ? base * (selectedPaymentMethod.adjustmentValue / 100)
      : selectedPaymentMethod.adjustmentValue;
    return selectedPaymentMethod.adjustmentType === 'discount' ? -raw : raw;
  })();
  // What's actually sent to the backend as `discount` — folds the payment-method adjustment in,
  // so total - discountForBackend still equals finalTotal (the schema has no separate field for it).
  const discountForBackend = effectiveDiscount - paymentAdjustment;
  const finalTotal = total - discountForBackend;

  // Whether the register is currently open: the most recent opening/closing entry is an "opening"
  const isCashOpen = React.useMemo(() => {
    const sessionEvents = cashFlows
      .filter(f => f.type === 'opening' || f.type === 'closing')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sessionEvents.length > 0 && sessionEvents[0].type === 'opening';
  }, [cashFlows]);

  const handleOpenCash = async () => {
    if (isCashOpen) { toast('O caixa já está aberto', 'warning'); return; }
    const amount = parseFloat(openingAmount);
    if (isNaN(amount) || amount < 0) {
      toast('Informe um valor válido', 'warning');
      return;
    }
    try {
      await api.post('/cash-flow', {
        type: 'opening',
        description: 'Abertura de caixa',
        amount,
        userId: user?.id,
      });
      toast('Caixa aberto com sucesso!', 'success');
      setShowOpeningModal(false);
      setOpeningAmount('');
      mutateCashFlow();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao abrir caixa', 'error');
    }
  };

  const openClosingModal = () => {
    if (!isCashOpen) { toast('O caixa ainda não foi aberto', 'warning'); return; }
    setCountedAmount('');
    setShowClosingModal(true);
  };

  const handleCloseCash = async () => {
    const counted = parseFloat(countedAmount);
    if (isNaN(counted) || counted < 0) {
      toast('Informe o valor contado em caixa', 'warning');
      return;
    }
    const discrepancy = counted - cashSummary.balance;
    setIsClosing(true);
    try {
      await api.post('/cash-flow', {
        type: 'closing',
        description: `Fechamento de caixa — esperado ${formatPrice(cashSummary.balance)}, contado ${formatPrice(counted)}${discrepancy !== 0 ? `, diferença ${formatPrice(discrepancy)}` : ''}`,
        amount: counted,
        userId: user?.id,
      });
      toast(discrepancy === 0 ? 'Caixa fechado sem divergências!' : `Caixa fechado com diferença de ${formatPrice(discrepancy)}`, discrepancy === 0 ? 'success' : 'warning');
      setShowClosingModal(false);
      setCountedAmount('');
      mutateCashFlow();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao fechar caixa', 'error');
    } finally {
      setIsClosing(false);
    }
  };

  const handleGenerateReceipt = async (saleId: string) => {
    setGeneratingPdf(true);
    try {
      const res = await api.post('/reports/pdf', { type: 'receipt', saleId }, { responseType: 'blob' });
      if (res.data?.size && res.data.size < 300) {
        const text = await res.data.text();
        try { const j = JSON.parse(text); if (j.error) throw new Error(j.error); } catch (e: any) { if (e.message && !e.message.includes('JSON')) throw e; }
      }
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-${saleId.slice(0, 8)}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast('Recibo gerado!', 'success');
    } catch (err: any) {
      toast(err.message || 'Erro ao gerar recibo', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const buildReceiptWaUrl = (sale: any) => {
    const items = (sale.items || []).map((i: any) => `• ${i.quantity}x ${i.product?.name || 'Produto'} — ${formatPrice(i.unitPrice * i.quantity)}`).join('\n');
    const payment = paymentTypeLabel(sale.paymentType, paymentMethodLabels);
    const msg = `🧾 *Recibo de Venda #${sale.id.slice(0, 8)}*\n` +
      `📅 ${new Date(sale.createdAt).toLocaleString('pt-BR')}\n` +
      (sale.client ? `👤 ${sale.client.name}\n` : '') +
      `💳 ${payment}\n\n` +
      `${items}\n\n` +
      (sale.discount > 0 ? `💰 Subtotal: ${formatPrice(sale.total)}\n🔻 Desconto: -${formatPrice(sale.discount)}\n` : '') +
      `✅ *Total: ${formatPrice(sale.finalTotal)}*\n\n` +
      `Obrigado pela preferência! 🌸`;
    const clean = normalizeBrazilPhone(sale.client?.phone || '');
    const base = clean ? `https://wa.me/${clean}` : 'https://wa.me/';
    return `${base}?${new URLSearchParams({ text: msg }).toString()}`;
  };

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      toast('Adicione itens ao carrinho', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.post('/sales', {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        })),
        discount: discountForBackend,
        paymentType,
        notes: notes || undefined,
        userId: user?.id,
        clientId: selectedClientId || undefined,
        couponId: couponApplied?.coupon?.id || undefined,
        couponCode: couponApplied?.coupon?.code || undefined,
        couponDiscount: couponApplied ? couponApplied.discount : undefined,
      });

      // Record cash flow entry for the sale
      await api.post('/cash-flow', {
        type: 'entry',
        description: `Venda #${res.data.id?.slice(0, 8) || 'PDV'} - ${cart.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}`,
        amount: finalTotal,
        userId: user?.id,
      });

      toast(`Venda finalizada! Total: R$ ${finalTotal.toFixed(2)}`, 'success');
      setSaleCompleted({ id: res.data.id, total: finalTotal });
      setCart([]);
      setDiscount(0);
      setNegotiatedTotal('');
      setNotes('');
      setSelectedClientId('');
      setCouponCode('');
      setCouponApplied(null);
      setCouponError('');
      setShowConfirm(false);
      mutate('/products');
      mutate('/cash-flow');
      mutate('/sales');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao registrar venda', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePdf = async (type: string) => {
    setGeneratingPdf(true);
    try {
      const res = await api.post('/reports/pdf', { type }, { responseType: 'blob' });
      // Check if response is error JSON disguised as blob
      if (res.data?.size && res.data.size < 300) {
        const text = await res.data.text();
        try { const j = JSON.parse(text); if (j.error) throw new Error(j.error); } catch (e: any) { if (e.message && !e.message.includes('JSON')) throw e; }
      }
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${type}-${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast('Relatório gerado!', 'success');
    } catch (err: any) {
      toast(err.message || 'Erro ao gerar relatório', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  /** Realized profit for a sale — only counts items whose product has a registered cost price */
  const calcSaleProfit = (sale: any): number | null => {
    const items = sale.items || [];
    const withCost = items.filter((i: any) => i.product?.costPrice != null);
    if (withCost.length === 0) return null;
    const itemsProfit = withCost.reduce((sum: number, i: any) => sum + (i.unitPrice - i.product.costPrice) * i.quantity, 0);
    // Spread the sale-level discount proportionally (by value) across cost-tracked items so the figure reflects what was actually pocketed
    const totalSubtotal = items.reduce((s: number, i: any) => s + (i.subtotal ?? i.unitPrice * i.quantity), 0) || 1;
    const costTrackedSubtotal = withCost.reduce((s: number, i: any) => s + (i.subtotal ?? i.unitPrice * i.quantity), 0);
    const discountShare = (sale.discount || 0) * (costTrackedSubtotal / totalSubtotal);
    return itemsProfit - discountShare;
  };

  return (
    <AuthGuard>
      <DefaultPage title="Ponto de Venda">
        <Head>
          <title>PDV - Xananas&apos; Garden</title>
        </Head>
        <ToastContainer />
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="flex flex-col lg:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-4 md:p-6 min-w-0 pb-20 lg:pb-6">
              {/* Tabs */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto">
                {[
                  { key: 'sale', label: 'Venda', icon: ShoppingCart },
                  { key: 'cashflow', label: 'Fluxo de Caixa', icon: Wallet },
                  { key: 'sales', label: 'Vendas', icon: CheckCircle },
                  { key: 'reports', label: 'Relatórios', icon: FilePdf },
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.key
                          ? 'btn-glass-pink-solid text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ===== SALE TAB ===== */}
              {activeTab === 'sale' && (
                <>
                {/* Mobile step indicator */}
                <div className="lg:hidden flex items-center gap-2 mb-4">
                  {(['products', 'cart', 'payment'] as const).map((step, i) => (
                    <React.Fragment key={step}>
                      <button onClick={() => setMobileStep(step)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          mobileStep === step ? 'bg-[#de818d] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        {step === 'products' ? 'Produtos' : step === 'cart' ? 'Carrinho' : 'Pagamento'}
                      </button>
                      {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
                    </React.Fragment>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Products Grid */}
                  <div className={`${mobileStep !== 'products' ? 'hidden' : ''} lg:block ${cartOpen ? 'lg:col-span-3' : 'lg:col-span-5'}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 h-10">
                          <MagnifyingGlass size={16} className="text-gray-400" />
                          <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="flex-1 bg-transparent outline-none text-sm"
                            placeholder="Buscar produto..."
                          />
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{filteredProducts.length} disponíveis</span>
                      </div>

                      {/* Category filter */}
                      {categories.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
                          <button onClick={() => setSelectedCategoryId('')}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                              selectedCategoryId === '' ? 'bg-[#de818d] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            Todas
                          </button>
                          {categories.map(cat => (
                            <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)}
                              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                selectedCategoryId === cat.id ? 'bg-[#de818d] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}>
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[calc(100vh-220px)] overflow-y-auto">
                        {filteredProducts.map(product => (
                          <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="flex flex-col items-center gap-1 p-3 bg-gray-50 hover:bg-pink-50 hover:border-[#de818d] border border-gray-200 rounded-lg transition-colors text-center"
                          >
                            <Package size={24} className="text-[#de818d]" />
                            <p className="text-xs font-medium text-gray-800 line-clamp-2 w-full">{product.name}</p>
                            <p className="text-[10px] text-gray-400">{product.category?.name}</p>
                            <p className="text-sm font-bold text-[#de818d]">{formatPrice(product.price)}</p>
                            <p className="text-[10px] text-green-600">Estoque: {product.amount}</p>
                          </button>
                        ))}
                        {filteredProducts.length === 0 && (
                          <div className="col-span-full py-8 text-center text-gray-400 text-sm">
                            Nenhum produto disponível
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cart */}
                  <div className={`${mobileStep !== 'cart' && mobileStep !== 'payment' ? 'hidden' : ''} ${cartOpen ? 'lg:block lg:col-span-2' : 'lg:hidden'}`}>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
                      <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setMobileStep(mobileStep === 'payment' ? 'cart' : 'products')} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">←</button>
                        <ShoppingCart size={20} className="text-[#de818d]" />
                        <h2 className="font-semibold text-gray-800">{mobileStep === 'payment' ? 'Pagamento' : 'Carrinho'}</h2>
                        {cart.length > 0 && (
                          <span className="bg-[#de818d] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {cart.reduce((s, i) => s + i.quantity, 0)}
                          </span>
                        )}
                        <button onClick={() => setCartOpen(false)} title="Ocultar carrinho"
                          className="hidden lg:flex ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                          <CaretRight size={16} />
                        </button>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                        {cart.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">
                            Clique em um produto para adicionar
                          </p>
                        ) : (
                          cart.map(item => (
                            <div key={item.product.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-800 truncate">{item.product.name}</p>
                                <p className="text-[10px] text-gray-400">{formatPrice(item.product.price)} un.</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Editable only in the "cart" step on mobile (and always on desktop) — "payment" is a read-only summary */}
                                <button onClick={() => updateQuantity(item.product.id, -1)}
                                  className={`w-6 h-6 items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-600 ${mobileStep === 'payment' ? 'hidden lg:flex' : 'flex'}`}>
                                  <Minus size={12} />
                                </button>
                                <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, 1)}
                                  className={`w-6 h-6 items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-gray-600 ${mobileStep === 'payment' ? 'hidden lg:flex' : 'flex'}`}>
                                  <Plus size={12} />
                                </button>
                              </div>
                              <p className="text-xs font-bold text-[#de818d] w-16 text-right">
                                {formatPrice(item.product.price * item.quantity)}
                              </p>
                              <button onClick={() => removeFromCart(item.product.id)}
                                className={`text-gray-400 hover:text-red-500 ${mobileStep === 'payment' ? 'hidden lg:block' : ''}`}>
                                <Trash size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {cart.length > 0 && (
                        <>
                        {/* Cliente + Cupom — editable in the mobile "cart" step (and always on desktop); a read-only summary replaces them in "payment" */}
                        <div className={mobileStep === 'payment' ? 'hidden lg:block' : ''}>
                          <div className="mb-3 relative">
                            <label className="text-xs text-gray-500 mb-1 block">Cliente</label>
                            {selectedClient ? (
                              <div className="flex items-center justify-between p-2 border border-gray-200 rounded-lg text-sm bg-gray-50">
                                <span className="text-gray-700 truncate">{selectedClient.name}</span>
                                <button type="button" onClick={() => { setSelectedClientId(''); setClientSearch(''); }}
                                  className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={clientSearch}
                                onChange={e => { setClientSearch(e.target.value); setClientPickerOpen(true); }}
                                onFocus={() => setClientPickerOpen(true)}
                                onBlur={() => setTimeout(() => setClientPickerOpen(false), 150)}
                                placeholder="Avulso (padrão) — buscar por nome/telefone..."
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#de818d]"
                              />
                            )}
                            {clientPickerOpen && !selectedClient && (
                              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                {filteredClients.length === 0 ? (
                                  <p className="p-3 text-xs text-gray-400 text-center">Nenhum cliente encontrado</p>
                                ) : (
                                  filteredClients.map(c => (
                                    <button key={c.id} type="button"
                                      onMouseDown={() => { setSelectedClientId(c.id); setClientSearch(''); setClientPickerOpen(false); }}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex flex-col">
                                      <span className="text-gray-700">{c.name}</span>
                                      {(c.phone || c.whatsapp) && <span className="text-[10px] text-gray-400">{c.phone || c.whatsapp}</span>}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mb-3">
                            <label className="text-xs text-gray-500">Cupom de desconto</label>
                            <div className="flex gap-2 mt-1">
                              <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm uppercase font-mono outline-none focus:ring-1 focus:ring-[#de818d]"
                                placeholder="CÓDIGO" />
                              <button type="button" onClick={async () => {
                                if (!couponCode) return;
                                try {
                                  const items = cart.map(ci => ({
                                    productId: ci.product.id,
                                    categoryId: ci.product.categoryId || ci.product.category?.id,
                                    price: ci.product.price || 0,
                                    quantity: ci.quantity,
                                  }));
                                  const r = await api.post('/coupons/validate', { code: couponCode, total, items });
                                  setCouponApplied(r.data);
                                  setDiscount(r.data.discount);
                                  setCouponError('');
                                  const scope = r.data.coupon.targetType === 'global' ? 'em todo pedido' : `em ${r.data.coupon.targetType === 'category' ? 'categoria' : 'produto'}: ${r.data.coupon.targetName || ''}`;
                                  toast(`Cupom ${r.data.coupon.code} aplicado ${scope}! -${formatPrice(r.data.discount)}`, 'success');
                                } catch (err: any) {
                                  setCouponApplied(null);
                                  setCouponError(err.response?.data?.error || 'Cupom inválido');
                                }
                              }} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">Aplicar</button>
                            </div>
                            {couponApplied && (
                              <div className="text-xs text-green-600 mt-1 space-y-0.5">
                                <p>✓ Cupom {couponApplied.coupon.code} — {couponApplied.coupon.discountType === 'percentage' ? `${couponApplied.coupon.discountValue}%` : formatPrice(couponApplied.coupon.discountValue)} de desconto</p>
                                {couponApplied.coupon.targetType !== 'global' && (
                                  <p className="text-green-500">Aplicado em: {couponApplied.coupon.targetType === 'category' ? `Categoria` : `Produto`} — {couponApplied.coupon.targetName || ''}</p>
                                )}
                                {couponApplied.applicableSubtotal != null && couponApplied.coupon.targetType !== 'global' && (
                                  <p className="text-green-500">Subtotal elegível: {formatPrice(couponApplied.applicableSubtotal)}</p>
                                )}
                              </div>
                            )}
                            {couponError && <p className="text-xs text-red-500 mt-1">✗ {couponError}</p>}
                          </div>
                        </div>

                        {/* Mobile "payment" step: previous choices shown as a read-only summary — go back to "cart" to change them */}
                        {mobileStep === 'payment' && (
                          <div className="lg:hidden mb-3 p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600 space-y-1">
                            <p className="font-semibold text-gray-700">Resumo</p>
                            <p>Cliente: {selectedClient ? selectedClient.name : 'Avulso'}</p>
                            {couponApplied ? (
                              <p>Cupom: {couponApplied.coupon.code} (-{formatPrice(discount)})</p>
                            ) : (
                              <p>Cupom: nenhum</p>
                            )}
                          </div>
                        )}

                        <div className={mobileStep !== 'payment' ? 'hidden lg:block' : ''}>
                          <div className="mb-3">
                            <label className="text-xs text-gray-500">Desconto (R$)</label>
                            <input type="number" value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                              disabled={isNegotiated}
                              min="0" step="0.01"
                              className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#de818d] disabled:bg-gray-100 disabled:text-gray-400"
                              placeholder="0.00" />
                          </div>

                          <div className="mb-3">
                            <label className="text-xs text-gray-500">Valor final (negociado)</label>
                            <input type="number" value={negotiatedTotal} onChange={e => setNegotiatedTotal(e.target.value)}
                              min="0" step="0.01"
                              className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#de818d]"
                              placeholder={formatPrice(total - discount)} />
                            <p className="text-[10px] text-gray-400 mt-1">Sobrescreve o desconto acima — use quando o valor combinado com o cliente for diferente do calculado.</p>
                          </div>

                          <div className="mb-3">
                            <label className="text-xs text-gray-500 mb-1 block">Pagamento</label>
                            {availablePaymentMethods.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">Nenhuma forma de pagamento disponível para os itens do carrinho.</p>
                            ) : (
                              <div className="grid grid-cols-4 gap-1">
                                {availablePaymentMethods.map(m => {
                                  const Icon = PAYMENT_METHOD_ICONS[m.key] || Wallet;
                                  return (
                                    <button key={m.id} onClick={() => setPaymentType(m.key)}
                                      title={m.adjustmentType && m.adjustmentValue ? formatAdjustmentHint(m) : undefined}
                                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors ${
                                        paymentType === m.key
                                          ? 'border-[#de818d] bg-pink-50 text-[#de818d]'
                                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                      }`}>
                                      <Icon size={16} />
                                      {m.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="mb-3">
                            <label className="text-xs text-gray-500">Observações</label>
                            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                              className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#de818d]"
                              placeholder="Opcional" />
                          </div>

                          <div className="border-t border-gray-200 pt-3 space-y-1">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Subtotal</span><span>{formatPrice(total)}</span>
                            </div>
                            {effectiveDiscount > 0 && (
                              <div className="flex justify-between text-sm text-green-600">
                                <span>Desconto</span><span>-{formatPrice(effectiveDiscount)}</span>
                              </div>
                            )}
                            {effectiveDiscount < 0 && (
                              <div className="flex justify-between text-sm text-blue-600">
                                <span>Acréscimo</span><span>+{formatPrice(-effectiveDiscount)}</span>
                              </div>
                            )}
                            {paymentAdjustment !== 0 && (
                              <div className={`flex justify-between text-sm ${paymentAdjustment < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                                <span>{paymentAdjustment < 0 ? 'Desconto' : 'Acréscimo'} ({selectedPaymentMethod?.name})</span>
                                <span>{paymentAdjustment < 0 ? '-' : '+'}{formatPrice(Math.abs(paymentAdjustment))}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-gray-800 pt-1">
                              <span>Total{isNegotiated && <span className="text-xs font-normal text-gray-400"> (negociado)</span>}</span>
                              <span className="text-[#de818d]">{formatPrice(finalTotal)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Mobile "cart" step: quick total + move on to payment */}
                        {mobileStep === 'cart' && (
                          <div className="lg:hidden mt-3">
                            <div className="flex justify-between text-base font-bold text-gray-800 mb-2">
                              <span>Total</span>
                              <span className="text-[#de818d]">{formatPrice(finalTotal)}</span>
                            </div>
                            <button onClick={() => setMobileStep('payment')}
                              className="w-full flex items-center justify-center gap-2 btn-glass-pink-solid text-white font-medium py-2.5 rounded-lg text-sm">
                              Próximo: Pagamento <CaretRight size={14} />
                            </button>
                          </div>
                        )}

                        <button onClick={() => setShowConfirm(true)}
                          className={`w-full mt-4 items-center justify-center gap-2 btn-glass-green-solid text-white font-semibold py-3 rounded-xl ${mobileStep === 'payment' ? 'flex' : 'hidden lg:flex'}`}>
                          <CheckCircle size={20} />
                          Finalizar Venda
                        </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Floating reopen button — desktop only, shown while the cart panel is collapsed */}
                {!cartOpen && (
                  <button onClick={() => setCartOpen(true)}
                    className="hidden lg:flex fixed bottom-6 right-6 z-30 items-center gap-2 btn-glass-pink-solid text-white pl-4 pr-5 py-3 rounded-full shadow-lg">
                    <CaretLeft size={16} />
                    <ShoppingCart size={18} />
                    Carrinho
                    {cart.length > 0 && (
                      <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {cart.reduce((s, i) => s + i.quantity, 0)}
                      </span>
                    )}
                  </button>
                )}
                </>
              )}

              {/* ===== CASH FLOW TAB ===== */}
              {activeTab === 'cashflow' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowOpeningModal(true)} disabled={isCashOpen}
                      className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ArrowUp size={16} /> Abrir Caixa
                    </button>
                    <button onClick={openClosingModal} disabled={!isCashOpen}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed">
                      <SignOut size={16} /> Fechar Caixa
                    </button>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${isCashOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isCashOpen ? 'Caixa aberto' : 'Caixa fechado'}
                    </span>
                    <div className="flex-1" />
                    <button onClick={() => handleGeneratePdf('cashflow')} disabled={generatingPdf}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                      <FilePdf size={16} /> PDF
                    </button>
                  </div>

                  {/* Summary cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Entradas</p>
                      <p className="text-2xl font-bold text-green-600">{formatPrice(cashSummary.totalEntries)}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Saídas</p>
                      <p className="text-2xl font-bold text-red-600">{formatPrice(cashSummary.totalExits)}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Saldo</p>
                      <p className={`text-2xl font-bold ${cashSummary.balance >= 0 ? 'text-[#de818d]' : 'text-red-600'}`}>
                        {formatPrice(cashSummary.balance)}
                      </p>
                    </div>
                  </div>

                  {/* Cash flow list */}
                  {loadingCashFlow ? (
                    <div className="flex items-center justify-center py-12"><AnimatedLogo size={40} /></div>
                  ) : cashFlows.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Wallet size={48} className="mx-auto mb-3 text-gray-200" />
                      <p>Nenhum registro de fluxo de caixa</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Tipo</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Descrição</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Responsável</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-500">Valor</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {cashFlows.map(flow => {
                            // Check if this flow is linked to a sale (referenceId exists and description starts with 'Venda')
                            const saleId = flow.type === 'entry' && flow.description?.startsWith('Venda') ? flow.referenceId : null;
                            return (
                            <tr key={flow.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {new Date(flow.createdAt).toLocaleString('pt-BR')}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  flow.type === 'entry' || flow.type === 'opening' ? 'bg-green-100 text-green-700'
                                    : flow.type === 'closing' ? 'bg-blue-100 text-blue-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {flow.type === 'entry' ? 'Entrada' : flow.type === 'exit' ? 'Saída'
                                    : flow.type === 'opening' ? 'Abertura' : 'Fechamento'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">{flow.description}</td>
                              <td className="px-4 py-3 text-xs text-gray-500">{flow.user?.name || '-'}</td>
                              <td className={`px-4 py-3 text-xs font-bold text-right ${
                                flow.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {flow.amount >= 0 ? '+' : ''}{formatPrice(Math.abs(flow.amount))}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {saleId && (
                                  <button onClick={() => handleGenerateReceipt(saleId)} disabled={generatingPdf}
                                    className="p-1.5 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded transition-colors"
                                    title="Reimprimir recibo">
                                    <FilePdf size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ===== SALES HISTORY TAB ===== */}
              {activeTab === 'sales' && (
                <div className="space-y-4">
                  {loadingSales ? (
                    <div className="flex items-center justify-center py-12"><AnimatedLogo size={40} /></div>
                  ) : salesList.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <CheckCircle size={48} className="mx-auto mb-3 text-gray-200" />
                      <p>Nenhuma venda registrada</p>
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Cliente</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Pagamento</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-500">Desconto</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-500">Lucro</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {salesList.map((sale: any) => {
                            const profit = calcSaleProfit(sale);
                            return (
                            <tr key={sale.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {new Date(sale.createdAt).toLocaleString('pt-BR')}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                {sale.client?.name || 'Avulso'}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {paymentTypeLabel(sale.paymentType, paymentMethodLabels)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {sale.discount > 0 ? `-${formatPrice(sale.discount)}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-right text-[#de818d]">
                                {formatPrice(sale.finalTotal)}
                              </td>
                              <td className={`px-4 py-3 text-xs font-bold text-right ${profit == null ? 'text-gray-300' : profit >= 0 ? 'text-green-600' : 'text-red-500'}`}
                                title={profit == null ? 'Nenhum item desta venda tem custo cadastrado' : undefined}>
                                {profit == null ? '—' : formatPrice(profit)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleGenerateReceipt(sale.id)} disabled={generatingPdf}
                                    className="p-1.5 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded transition-colors"
                                    title="Gerar recibo PDF">
                                    <FilePdf size={14} />
                                  </button>
                                  <a href={buildReceiptWaUrl(sale)} target="_blank" rel="noopener noreferrer"
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Compartilhar via WhatsApp">
                                    📱
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );})}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ===== REPORTS TAB ===== */}
              {activeTab === 'reports' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { type: 'stock', label: 'Relatório de Estoque', description: 'Lista completa de produtos com quantidades e preços', icon: Package },
                    { type: 'sales', label: 'Relatório de Vendas', description: 'Histórico de vendas com período, atendente e valores', icon: ShoppingCart },
                    { type: 'cashflow', label: 'Fluxo de Caixa', description: 'Entradas, saídas e saldo do período', icon: Wallet },
                    { type: 'purchases', label: 'Relatório de Compras', description: 'Histórico de compras por fornecedor e período', icon: Truck },
                    { type: 'suppliers', label: 'Relatório de Fornecedores', description: 'Lista de fornecedores, produtos e gasto total', icon: Storefront },
                    { type: 'coupon-usage', label: 'Uso de Cupons', description: 'Quem usou cada cupom, quando e o desconto concedido', icon: Ticket },
                  ].map(report => {
                    const Icon = report.icon;
                    return (
                      <button
                        key={report.type}
                        onClick={() => handleGeneratePdf(report.type)}
                        disabled={generatingPdf}
                        className="bg-white border border-gray-200 rounded-xl p-6 text-left hover:border-[#de818d]/30 transition-all group disabled:opacity-50"
                      >
                        <Icon size={32} className="text-[#de818d] mb-3" />
                        <h3 className="font-semibold text-gray-800 mb-1">{report.label}</h3>
                        <p className="text-xs text-gray-500">{report.description}</p>
                        <div className="mt-4 flex items-center gap-1 text-xs text-[#de818d] font-medium group-hover:underline">
                          <FilePdf size={14} />
                          Gerar PDF
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowConfirm(false)} />
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar Venda</h3>
              <p className="text-sm text-gray-500 mb-4">
                {cart.reduce((s, i) => s + i.quantity, 0)} itens • {formatPrice(finalTotal)}
              </p>
              <div className="space-y-1 mb-4 max-h-40 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.quantity}x {item.product.name}</span>
                    <span className="font-medium">{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
                  Cancelar
                </button>
                <button onClick={handleFinalizeSale} disabled={isProcessing}
                  className="flex-1 py-2.5 btn-glass-green-solid disabled:bg-gray-400 text-white rounded-lg text-sm font-medium">
                  {isProcessing ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Opening cash modal */}
        {showOpeningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowOpeningModal(false)} />
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Abrir Caixa</h3>
              <p className="text-sm text-gray-500 mb-4">Informe o valor de abertura</p>
              <input type="number" value={openingAmount} onChange={e => setOpeningAmount(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#de818d] mb-4"
                placeholder="R$ 0,00" step="0.01" min="0" autoFocus />
              <div className="flex gap-2">
                <button onClick={() => setShowOpeningModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
                  Cancelar
                </button>
                <button onClick={handleOpenCash}
                  className="flex-1 py-2.5 btn-glass-green-solid text-white rounded-lg text-sm font-medium">
                  Abrir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Closing cash modal — requires counting the physical cash before closing */}
        {showClosingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowClosingModal(false)} />
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Fechar Caixa</h3>
              <p className="text-sm text-gray-500 mb-1">Saldo esperado pelo sistema</p>
              <p className="text-2xl font-bold text-gray-800 mb-4">{formatPrice(cashSummary.balance)}</p>
              <label className="block text-sm text-gray-600 mb-1">Valor contado no caixa (dinheiro físico)</label>
              <input type="number" value={countedAmount} onChange={e => setCountedAmount(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#de818d] mb-2"
                placeholder="R$ 0,00" step="0.01" min="0" autoFocus />
              {countedAmount !== '' && !isNaN(parseFloat(countedAmount)) && (
                (() => {
                  const diff = parseFloat(countedAmount) - cashSummary.balance;
                  if (diff === 0) return <p className="text-xs text-green-600 mb-4">✓ Sem divergências</p>;
                  return (
                    <p className={`text-xs mb-4 font-medium ${diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {diff > 0 ? `Sobra de ${formatPrice(diff)}` : `Falta de ${formatPrice(Math.abs(diff))}`}
                    </p>
                  );
                })()
              )}
              <div className="flex gap-2">
                <button onClick={() => setShowClosingModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
                  Cancelar
                </button>
                <button onClick={handleCloseCash} disabled={isClosing}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                  {isClosing ? 'Fechando...' : 'Confirmar Fechamento'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post-sale invoice modal */}
        {saleCompleted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSaleCompleted(null)} />
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Venda Finalizada!</h3>
              <p className="text-sm text-gray-500 mb-1">Total: <strong className="text-[#de818d]">{formatPrice(saleCompleted.total)}</strong></p>
              <p className="text-xs text-gray-400 mb-5">Nota: #{saleCompleted.id?.slice(0, 8)}</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => handleGenerateReceipt(saleCompleted.id)} disabled={generatingPdf}
                  className="w-full py-2.5 bg-[#de818d] hover:bg-[#c96a76] text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {generatingPdf ? 'Gerando...' : '📄 Gerar Recibo PDF'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { window.print(); setSaleCompleted(null); }}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                    🖨️ Imprimir
                  </button>
                  <button onClick={() => {
                    const text = `Nota de Venda #${saleCompleted.id?.slice(0,8)}\nTotal: R$ ${saleCompleted.total.toFixed(2)}\nObrigado pela preferência! 🌸`;
                    if (navigator.share) { navigator.share({ title: 'Nota Fiscal', text }); }
                    else { navigator.clipboard.writeText(text); toast('Nota copiada!', 'success'); }
                    setSaleCompleted(null);
                  }}
                    className="flex-1 py-2.5 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium">
                    📤 Compartilhar
                  </button>
                </div>
              </div>
              <button onClick={() => setSaleCompleted(null)}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600">Fechar</button>
            </div>
          </div>
        )}
      </DefaultPage>
    </AuthGuard>
  );
};

export default PDV;
