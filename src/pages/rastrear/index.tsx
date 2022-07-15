import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Package, MagnifyingGlass, CheckCircle, Clock, Truck, MapPin, Circle } from 'phosphor-react';
import { api } from '../../lib/api';
import { paymentTypeLabel } from '../../lib/paymentType';
import AnimatedLogo from '../../components/AnimatedLogo';

const STATUS_STEPS = [
  { key: 'pending', label: 'Pendente', icon: Clock, color: 'text-gray-400', activeColor: 'text-yellow-500' },
  { key: 'confirmed', label: 'Confirmado', icon: CheckCircle, color: 'text-gray-400', activeColor: 'text-blue-500' },
  { key: 'preparing', label: 'Preparando', icon: Package, color: 'text-gray-400', activeColor: 'text-purple-500' },
  { key: 'shipped', label: 'Enviado', icon: Truck, color: 'text-gray-400', activeColor: 'text-orange-500' },
  { key: 'delivered', label: 'Entregue', icon: MapPin, color: 'text-gray-400', activeColor: 'text-green-500' },
];

export default function RastrearPage() {
  const [saleId, setSaleId] = useState('');
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleId.trim()) return;
    setLoading(true);
    setError('');
    setSale(null);
    try {
      // We'll use the public sales endpoint - fetch all and filter by ID prefix
      const res = await api.get(`/sales/${saleId.trim()}`);
      setSale(res.data);
    } catch {
      setError('Pedido não encontrado. Verifique o código e tente novamente.');
    }
    setLoading(false);
  };

  const currentStepIndex = sale ? STATUS_STEPS.findIndex(s => s.key === sale.status) : -1;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Rastrear Pedido - Xananas&apos; Garden</title>
      </Head>

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/catalogo" className="font-gloria text-[#de818d] text-xl">Xananas&apos; Garden</Link>
          <Package size={20} className="text-gray-400" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Truck size={48} className="mx-auto text-[#de818d] mb-3" />
          <h1 className="text-2xl font-bold text-gray-800">Rastrear Pedido</h1>
          <p className="text-gray-500 mt-1">Digite o código do pedido para acompanhar a entrega</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={saleId}
              onChange={e => setSaleId(e.target.value)}
              placeholder="Código do pedido (ex: a1b2c3d4)"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d] font-mono"
            />
            <button type="submit" disabled={loading}
              className="px-6 py-3 bg-[#de818d] text-white rounded-xl hover:bg-[#c96a76] transition-colors disabled:opacity-50 flex items-center gap-2">
              {loading ? <AnimatedLogo size={16} /> : <MagnifyingGlass size={18} />}
              Buscar
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Sale details */}
        {sale && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Status header */}
            <div className="bg-gradient-to-r from-[#de818d]/10 to-pink-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-gray-800">Pedido #{sale.id.slice(0, 8)}</h2>
                <span className="text-xs text-gray-500">{new Date(sale.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              <p className="text-2xl font-bold text-[#de818d]">
                R$ {(sale.finalTotal || sale.total || 0).toFixed(2)}
              </p>
            </div>

            {/* Status timeline */}
            <div className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Status do Pedido</h3>
              <div className="relative">
                {STATUS_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step.key} className="flex items-start gap-3 mb-4 last:mb-0">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-[#de818d]/10' : 'bg-gray-100'}`}>
                          <Icon size={16} className={isActive ? step.activeColor : step.color} />
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 ${isActive ? 'bg-[#de818d]/30' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.label}
                          {isCurrent && <span className="ml-2 text-[10px] bg-[#de818d] text-white px-2 py-0.5 rounded-full">Atual</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            {sale.items && sale.items.length > 0 && (
              <div className="border-t border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Itens</h3>
                <div className="space-y-2">
                  {sale.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {item.quantity}x {item.product?.name || 'Produto'}
                      </span>
                      <span className="font-medium text-gray-800">
                        R$ {(item.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment info */}
            <div className="border-t border-gray-100 p-6 bg-gray-50">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pagamento:</span>
                <span className="font-medium text-gray-700">
                  {sale.paymentType === 'money' ? '💵 ' : sale.paymentType === 'card' ? '💳 ' : sale.paymentType === 'pix' ? '📱 ' : '🔘 '}
                  {paymentTypeLabel(sale.paymentType)}
                </span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Desconto:</span>
                  <span className="text-green-600">-R$ {sale.discount.toFixed(2)}</span>
                </div>
              )}
              {sale.couponCode && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Cupom:</span>
                  <span className="text-[#de818d] font-mono">{sale.couponCode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <Link href="/catalogo" className="text-sm text-[#de818d] hover:underline">
            ← Voltar ao catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
