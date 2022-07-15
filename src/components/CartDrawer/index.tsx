import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { X, Plus, Minus, Trash, ShoppingCart, ArrowRight, CheckCircle, ChatCircleDots } from 'phosphor-react';
import { api } from '../../lib/api';
import { openWhatsApp } from '../../lib/settings';
import AnimatedLogo from '../AnimatedLogo';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddressForm {
  zip: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface Form {
  name: string;
  phoneCode: string;
  phone: string;
  email: string;
  address: AddressForm;
  notes: string;
}

const BRAZIL_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const emptyForm: Form = {
  name: '', phoneCode: '55', phone: '', email: '',
  address: { zip: '', street: '', number: '', neighborhood: '', city: '', state: '' },
  notes: '',
};

function formatPhoneBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatZipBR(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function validatePhoneBR(phoneCode: string, phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return 'Telefone deve ter 10 ou 11 dígitos';
  if (digits.length === 11 && digits[2] !== '9') return 'Celular deve começar com 9 após o DDD';
  const ddd = parseInt(digits.slice(0, 2));
  if (ddd < 11 || ddd > 99) return 'DDD inválido';
  return null;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [form, setForm] = useState<Form>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const [savedItems, setSavedItems] = useState<{name: string; quantity: number; price: number}[]>([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [savedRequestId, setSavedRequestId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatPhoneBR(raw);
    setForm(prev => ({ ...prev, phone: formatted }));
    const err = validatePhoneBR(form.phoneCode, raw);
    setPhoneError(err || '');
  };

  const handleZipBlur = async () => {
    const zip = form.address.zip.replace(/\D/g, '');
    if (zip.length !== 8) return;
    setZipLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${zip}`);
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.street || prev.address.street,
            neighborhood: data.neighborhood || prev.address.neighborhood,
            city: data.city || prev.address.city,
            state: data.state || prev.address.state,
          },
        }));
      }
    } catch {
      // Ignore — user can fill manually
    } finally {
      setZipLoading(false);
    }
  };

  const buildFullAddress = (): string => {
    const { street, number, neighborhood, city, state, zip } = form.address;
    const parts = [street, number, neighborhood, city, state, zip ? `CEP: ${zip}` : ''].filter(Boolean);
    return parts.join(', ');
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const phoneErr = validatePhoneBR(form.phoneCode, form.phone);
    if (phoneErr) { setPhoneError(phoneErr); return; }
    setSubmitting(true);
    try {
      setSavedItems(items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })));
      setSavedTotal(total);
      const fullPhone = `+${form.phoneCode}${form.phone.replace(/\D/g, '')}`;
      const res = await api.post('/purchase-requests', {
        customerName: form.name,
        customerPhone: fullPhone,
        customerPhoneCode: form.phoneCode,
        customerEmail: form.email || undefined,
        customerAddress: buildFullAddress(),
        customerStreet: form.address.street || undefined,
        customerNumber: form.address.number || undefined,
        customerNeighborhood: form.address.neighborhood || undefined,
        customerCity: form.address.city || undefined,
        customerState: form.address.state || undefined,
        customerZip: form.address.zip || undefined,
        customerNotes: form.notes || undefined,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      });
      setSavedRequestId(res.data.id);
      clearCart();
      setStep('success');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao enviar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsApp = () => {
    const itemsList = savedItems.map(i => `• ${i.quantity}x ${i.name} — ${formatPrice(i.price * i.quantity)}`).join('\n');
    const msg = `🛒 *Solicitação de Compra*${savedRequestId ? `\nID: #${savedRequestId.slice(0, 8)}` : ''}\n\n` +
      `👤 *Cliente:* ${form.name}\n` +
      `📱 *Telefone:* +${form.phoneCode} ${form.phone}\n` +
      `📍 *Endereço:* ${buildFullAddress()}\n` +
      (form.email ? `📧 *Email:* ${form.email}\n` : '') +
      (form.notes ? `📝 *Obs:* ${form.notes}\n` : '') +
      `\n*Itens:*\n${itemsList}\n\n` +
      `💰 *Total:* ${formatPrice(savedTotal)}\n\n` +
      `Aguardo confirmação!`;
    openWhatsApp(msg);
  };

  const formatPrice = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#de818d]" />
            <h2 className="font-bold text-gray-800">
              {step === 'cart' ? `Carrinho (${itemCount})` : step === 'checkout' ? 'Finalizar Pedido' : 'Pedido Enviado!'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'success' ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Solicitação Enviada!</h3>
              <p className="text-sm text-gray-500 mb-4">Recebemos sua solicitação de compra.</p>
              {savedRequestId && <p className="text-xs text-gray-400 mb-4">ID: #{savedRequestId.slice(0, 8)}</p>}
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button onClick={handleSendWhatsApp}
                  className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors">
                  <ChatCircleDots size={18} /> Enviar resumo no WhatsApp
                </button>
                <button onClick={() => { setStep('cart'); onClose(); }}
                  className="px-6 py-2.5 bg-[#de818d] text-white rounded-lg font-medium text-sm hover:bg-[#c96a76]">
                  Continuar Comprando
                </button>
              </div>
            </div>
          ) : step === 'checkout' ? (
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-500 mb-2">Preencha seus dados para finalizar a solicitação.</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input name="name" value={form.name} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="Seu nome completo" />
              </div>

              {/* Phone with country code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Telefone *</label>
                <div className="flex gap-2">
                  <select value={form.phoneCode} onChange={e => setForm(prev => ({ ...prev, phoneCode: e.target.value }))}
                    className="w-20 px-2 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d] bg-gray-50">
                    <option value="55">🇧🇷 +55</option>
                    <option value="1">🇺🇸 +1</option>
                    <option value="351">🇵🇹 +351</option>
                    <option value="34">🇪🇸 +34</option>
                  </select>
                  <input name="phone" value={form.phone} onChange={handlePhoneChange}
                    className={`flex-1 px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d] ${
                      phoneError ? 'border-red-400' : 'border-gray-200'
                    }`}
                    placeholder="(84) 99999-9999" />
                </div>
                {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                <p className="text-[10px] text-gray-400 mt-1">Formato: (DDD) 9XXXX-XXXX</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="email@exemplo.com" />
              </div>

              {/* Structured Address */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Endereço de entrega *</h4>
                
                <div className="flex gap-2">
                  <div className="w-32">
                    <label className="block text-[10px] text-gray-500 mb-0.5">CEP</label>
                    <input name="zip" value={form.address.zip} onChange={e => handleAddressChange({ ...e, target: { ...e.target, name: 'zip', value: formatZipBR(e.target.value) } })}
                      onBlur={handleZipBlur}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                      placeholder="59000-000" />
                    {zipLoading && <p className="text-[10px] text-[#de818d]">Buscando...</p>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Rua</label>
                    <input name="street" value={form.address.street} onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                      placeholder="Rua, Avenida..." />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-24">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Nº</label>
                    <input name="number" value={form.address.number} onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                      placeholder="685" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Bairro</label>
                    <input name="neighborhood" value={form.address.neighborhood} onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                      placeholder="Bairro" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Cidade</label>
                    <input name="city" value={form.address.city} onChange={handleAddressChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                      placeholder="Cidade" />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] text-gray-500 mb-0.5">UF</label>
                    <select name="state" value={form.address.state} onChange={handleAddressChange}
                      className="w-full px-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]">
                      <option value="">UF</option>
                      {BRAZIL_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="Alguma observação sobre o pedido?" />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                {items.map(i => (
                  <div key={i.productId} className="flex justify-between text-xs text-gray-600">
                    <span>{i.quantity}x {i.name}</span>
                    <span>{formatPrice(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-[#de818d]">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep('cart')}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm hover:bg-gray-50">
                  ← Voltar
                </button>
                <button onClick={handleSubmit} disabled={submitting || !form.name.trim() || !form.phone.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                  {submitting ? <AnimatedLogo size={14} /> : <><ArrowRight size={16} /> Enviar Solicitação</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3 text-gray-200" />
                  <p>Seu carrinho está vazio</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {items.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">{formatPrice(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-100">
                            <Minus size={12} />
                          </button>
                          <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-100">
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-[#de818d] w-16 text-right">{formatPrice(item.price * item.quantity)}</span>
                        <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-500"><Trash size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-3 mb-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#de818d]">{formatPrice(total)}</span>
                    </div>
                  </div>
                  <button onClick={() => setStep('checkout')}
                    className="w-full flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-semibold py-3 rounded-xl transition-colors">
                    <ArrowRight size={20} /> Finalizar Pedido
                  </button>
                  <button onClick={clearCart}
                    className="w-full mt-2 text-xs text-gray-400 hover:text-red-500 py-2 transition-colors">
                    Limpar carrinho
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
