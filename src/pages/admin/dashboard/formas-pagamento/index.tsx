import React, { useState } from 'react';
import Head from 'next/head';
import { Plus, Trash, CreditCard, X, Pencil, FloppyDisk, CaretUp, CaretDown } from 'phosphor-react';
import useSWR from 'swr';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import { api } from '../../../../lib/api';
import { useToast } from '../../../../components/Toast';

interface PaymentMethod {
  id: string;
  key: string;
  name: string;
  active: boolean;
  isDefault: boolean;
  maxInstallments: number;
  adjustmentType: 'discount' | 'surcharge' | null;
  adjustmentValueType: 'percentage' | 'fixed' | null;
  adjustmentValue: number | null;
  order: number;
}

const emptyForm = {
  name: '', active: true, isDefault: false, maxInstallments: 1,
  adjustmentType: '' as '' | 'discount' | 'surcharge',
  adjustmentValueType: 'percentage' as 'percentage' | 'fixed',
  adjustmentValue: 0,
};

const fetcher = (url: string) => api.get(url).then(res => res.data);

const formatAdjustment = (m: PaymentMethod) => {
  if (!m.adjustmentType || !m.adjustmentValue) return '—';
  const sign = m.adjustmentType === 'discount' ? '-' : '+';
  const label = m.adjustmentType === 'discount' ? 'Desconto' : 'Acréscimo';
  const value = m.adjustmentValueType === 'percentage' ? `${m.adjustmentValue}%` : `R$ ${m.adjustmentValue.toFixed(2)}`;
  return `${label}: ${sign}${value}`;
};

const AdminFormasPagamento: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const { data: methods = [], mutate } = useSWR<PaymentMethod[]>('/payment-methods', fetcher, { revalidateOnFocus: true });
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const sorted = [...methods].sort((a, b) => a.order - b.order);

  const openCreate = () => { setIsEditing(false); setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (m: PaymentMethod) => {
    setIsEditing(true); setEditingId(m.id);
    setForm({
      name: m.name, active: m.active, isDefault: m.isDefault, maxInstallments: m.maxInstallments,
      adjustmentType: m.adjustmentType || '', adjustmentValueType: m.adjustmentValueType || 'percentage',
      adjustmentValue: m.adjustmentValue || 0,
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setIsEditing(false); setEditingId(null); setForm(emptyForm); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('Nome é obrigatório', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        active: form.active,
        isDefault: form.isDefault,
        maxInstallments: form.adjustmentType ? form.maxInstallments : form.maxInstallments,
        adjustmentType: form.adjustmentType || null,
        adjustmentValueType: form.adjustmentType ? form.adjustmentValueType : null,
        adjustmentValue: form.adjustmentType ? form.adjustmentValue : null,
      };
      if (isEditing && editingId) {
        await api.put(`/payment-methods/${editingId}`, payload);
        toast('Forma de pagamento atualizada!', 'success');
      } else {
        await api.post('/payment-methods', payload);
        toast('Forma de pagamento criada!', 'success');
      }
      closeModal();
      mutate();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta forma de pagamento? Produtos que a exigiam voltam a aceitar todas as formas ativas.')) return;
    try {
      await api.delete(`/payment-methods/${id}`);
      toast('Excluída!', 'success');
      mutate();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao excluir', 'error');
    }
  };

  const toggleField = async (m: PaymentMethod, field: 'active' | 'isDefault') => {
    try {
      await api.put(`/payment-methods/${m.id}`, { [field]: !m[field] });
      mutate();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao atualizar', 'error');
    }
  };

  const moveOrder = async (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[targetIdx];
    try {
      await Promise.all([
        api.put(`/payment-methods/${a.id}`, { order: b.order }),
        api.put(`/payment-methods/${b.id}`, { order: a.order }),
      ]);
      mutate();
    } catch {
      toast('Erro ao reordenar', 'error');
    }
  };

  return (
    <AuthGuard>
      <Head><title>Formas de Pagamento - Admin - Xananas&apos; Garden</title></Head>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CreditCard size={24} className="text-[#de818d]" />
                <h1 className="text-2xl font-bold text-gray-800">Formas de Pagamento</h1>
                <span className="text-sm text-gray-400">({methods.length})</span>
              </div>
              <button onClick={openCreate}
                className="flex items-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                <Plus size={18} /> Nova Forma de Pagamento
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              As formas marcadas como <strong>Padrão</strong> vêm pré-selecionadas ao cadastrar um produto novo — cada produto pode então ativar ou desativar formas individualmente. Formas inativas somem do PDV e do checkout.
            </p>

            {methods.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <CreditCard size={56} className="mx-auto mb-3 text-gray-200" />
                <p>Nenhuma forma de pagamento cadastrada</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-medium text-gray-500 w-16"></th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Nome</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Ativa</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Padrão</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-500">Parcelas máx.</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Ajuste</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sorted.map((m, idx) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveOrder(idx, 'up')} disabled={idx === 0} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><CaretUp size={13} /></button>
                            <button onClick={() => moveOrder(idx, 'down')} disabled={idx === sorted.length - 1} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"><CaretDown size={13} /></button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{m.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{m.key}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleField(m, 'active')}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${m.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {m.active ? 'Ativa' : 'Inativa'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleField(m, 'isDefault')}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${m.isDefault ? 'bg-[#de818d]/10 text-[#de818d]' : 'bg-gray-100 text-gray-400'}`}>
                            {m.isDefault ? 'Padrão' : '—'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{m.maxInstallments}x</td>
                        <td className="px-4 py-3 text-gray-600">{formatAdjustment(m)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(m)} className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg transition-colors" title="Editar"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(m.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="Ex: Boleto, Transferência..." autoFocus />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-[#de818d] rounded" />
                  <span className="text-sm text-gray-700">Ativa</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isDefault} onChange={e => setForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 text-[#de818d] rounded" />
                  <span className="text-sm text-gray-700">Padrão para novos produtos</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas máximas</label>
                <input type="number" min={1} max={24} value={form.maxInstallments}
                  onChange={e => setForm(prev => ({ ...prev, maxInstallments: parseInt(e.target.value) || 1 }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ajuste no total da venda</label>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {[
                    { value: '', label: 'Nenhum' },
                    { value: 'discount', label: 'Desconto' },
                    { value: 'surcharge', label: 'Acréscimo' },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(prev => ({ ...prev, adjustmentType: opt.value as any }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                        form.adjustmentType === opt.value ? 'border-[#de818d] bg-pink-50 text-[#de818d]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {form.adjustmentType && (
                  <div className="flex gap-2">
                    <select value={form.adjustmentValueType}
                      onChange={e => setForm(prev => ({ ...prev, adjustmentValueType: e.target.value as any }))}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]">
                      <option value="percentage">%</option>
                      <option value="fixed">R$</option>
                    </select>
                    <input type="number" min={0} step="0.01" value={form.adjustmentValue}
                      onChange={e => setForm(prev => ({ ...prev, adjustmentValue: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                      placeholder="0.00" />
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-1">Aplicado automaticamente no PDV quando essa forma de pagamento for escolhida.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                  {saving ? <AnimatedLogo size={14} /> : <FloppyDisk size={16} />}
                  {isEditing ? 'Atualizar' : 'Criar'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
};

export default AdminFormasPagamento;
