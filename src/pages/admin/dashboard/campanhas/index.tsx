import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../lib/api';
import useSWR from 'swr';
import {
  Megaphone, Plus, Pencil, Trash, X, Check, Percent, Money, Tag, Image as ImageIcon, Upload, Eye, GridFour, List
} from 'phosphor-react';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import TipTapEditor from '../../../../components/TipTapEditor';
import CampaignModalView from '../../../../components/CampaignModalView';
import ImageDropzone from '../../../../components/ImageDropzone';
import ImageEditorModal from '../../../../components/ImageEditorModal';
import { useGlobalPaste } from '../../../../hooks/useGlobalPaste';

interface CampaignProductItem {
  id: string;
  productId: string;
  highlightColor?: string | null;
  promoPrice?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  product: { id: string; name: string; price: number; images?: { image: string }[] };
}

interface Campaign {
  id: string;
  name: string;
  slug?: string | null;
  description?: string;
  discountType: string;
  discountValue: number;
  themeColor?: string;
  bgColor?: string;
  textColor?: string;
  glowColor?: string;
  heroImage?: string;
  modalImage?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  products: CampaignProductItem[];
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images?: { image: string }[];
  category?: { name: string };
}

// Curated color palettes for quick selection
const COLOR_PALETTES = [
  { name: 'Rosa Clássico', colors: ['#de818d', '#f48fb1', '#fce4ec', '#fff0f3'] },
  { name: 'Verde Natureza', colors: ['#4caf50', '#81c784', '#c8e6c9', '#e8f5e9'] },
  { name: 'Azul Oceano', colors: ['#2196f3', '#64b5f6', '#bbdefb', '#e3f2fd'] },
  { name: 'Dourado Premium', colors: ['#f59e0b', '#fbbf24', '#fef3c7', '#fffbeb'] },
  { name: 'Roxo Elegante', colors: ['#8b5cf6', '#a78bfa', '#ddd6fe', '#f5f3ff'] },
  { name: 'Vermelho Paixão', colors: ['#ef4444', '#f87171', '#fecaca', '#fef2f2'] },
  { name: 'Laranja Vibrante', colors: ['#f97316', '#fb923c', '#fed7aa', '#fff7ed'] },
  { name: 'Neutro Suave', colors: ['#6b7280', '#9ca3af', '#e5e7eb', '#f9fafb'] },
];

const Campanhas: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const emptyFormState = {
    name: '', description: '', discountType: 'percentage',
    discountValue: 0, startDate: '', endDate: '', active: true,
    themeColor: '#de818d', bgColor: '#fff0f3', textColor: '#ffffff', glowColor: '',
    heroImage: '', modalImage: '', modalTitle: '', modalSubtitle: '',
  };
  const [form, setForm] = useState(emptyFormState);
  interface SelectedProductConfig {
    mode: 'promoPrice' | 'discount';
    promoPrice: string;
    discountType: string;
    discountValue: string;
    highlightColor: string;
  }
  const emptyProductConfig: SelectedProductConfig = { mode: 'promoPrice', promoPrice: '', discountType: 'percentage', discountValue: '', highlightColor: '' };
  const [selectedProducts, setSelectedProducts] = useState<Record<string, SelectedProductConfig>>({});
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingHero, setEditingHero] = useState(false);

  const { data: campaigns = [], mutate } = useSWR<Campaign[]>(
    '/campaigns',
    (url: string) => api.get(url).then(r => r.data),
    { revalidateOnFocus: true }
  );

  const { data: allProducts = [] } = useSWR<Product[]>(
    '/products',
    (url: string) => api.get(url).then(r => r.data),
  );

  const filteredProducts = useMemo(() => {
    if (!productSearch) return allProducts;
    return allProducts.filter((p: Product) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [allProducts, productSearch]);

  const previewCampaign = useMemo(() => {
    const products = Object.keys(selectedProducts).map(pid => {
      const product = allProducts.find((p: Product) => p.id === pid);
      if (!product) return null;
      const cfg = selectedProducts[pid];
      return {
        id: pid,
        productId: pid,
        promoPrice: cfg.mode === 'promoPrice' && cfg.promoPrice ? parseFloat(cfg.promoPrice) : null,
        discountType: cfg.mode === 'discount' ? cfg.discountType : null,
        discountValue: cfg.mode === 'discount' && cfg.discountValue ? parseFloat(cfg.discountValue) : null,
        highlightColor: cfg.highlightColor || null,
        product,
      };
    }).filter(Boolean) as any[];
    return { ...form, products };
  }, [form, selectedProducts, allProducts]);

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('images', file);
    fd.append('type', 'campaign');
    try {
      const r = await fetch('/api/v1/uploads', { method: 'POST', body: fd });
      const d = await r.json();
      if (r.ok && d.images?.[0]?.url) return d.images[0].url;
    } catch {}
    return null;
  };

  const handleEditedHero = async (blob: Blob) => {
    setEditingHero(false);
    const file = new File([blob], `hero-${Date.now()}.webp`, { type: 'image/webp' });
    await uploadHeroFile(file, 'heroImage');
  };

  // Ctrl+V anywhere in the campaign modal pastes straight into the hero image
  useGlobalPaste(modalOpen && !editingHero, files => files[0] && uploadHeroFile(files[0], 'heroImage'));

  const uploadHeroFile = async (file: File, field: 'heroImage' | 'modalImage') => {
    toast('Enviando imagem...', 'info');
    const url = await uploadImage(file);
    if (url) {
      setForm(p => ({ ...p, [field]: url }));
      toast('Imagem enviada!', 'success');
    } else {
      toast('Erro ao enviar imagem', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImage' | 'modalImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadHeroFile(file, field);
  };

  const openCreate = () => {
    setIsEditing(false); setEditingId(null);
    setForm(emptyFormState);
    setSelectedProducts({}); setProductSearch(''); setShowPreview(false); setModalOpen(true);
  };

  const openEdit = (c: Campaign) => {
    setIsEditing(true); setEditingId(c.id);
    setForm({
      name: c.name, description: c.description || '',
      discountType: c.discountType, discountValue: c.discountValue,
      startDate: c.startDate ? c.startDate.split('T')[0] : '',
      endDate: c.endDate ? c.endDate.split('T')[0] : '', active: c.active,
      themeColor: c.themeColor || '#de818d', bgColor: c.bgColor || '#fff0f3',
      textColor: c.textColor || '#ffffff', glowColor: c.glowColor || '',
      heroImage: c.heroImage || '', modalImage: c.modalImage || '',
      modalTitle: c.modalTitle || '', modalSubtitle: c.modalSubtitle || '',
    });
    const prods: Record<string, SelectedProductConfig> = {};
    c.products.forEach((cp: CampaignProductItem) => {
      prods[cp.productId] = {
        mode: cp.promoPrice != null ? 'promoPrice' : 'discount',
        promoPrice: cp.promoPrice != null ? String(cp.promoPrice) : '',
        discountType: cp.discountType || 'percentage',
        discountValue: cp.discountValue != null ? String(cp.discountValue) : '',
        highlightColor: cp.highlightColor || '',
      };
    });
    setSelectedProducts(prods);
    setProductSearch('');
    setShowPreview(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyFormState);
    setSelectedProducts({});
    setShowPreview(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast('Nome é obrigatório', 'error'); return; }
    const productIds = Object.keys(selectedProducts);
    if (productIds.length === 0) { toast('Selecione pelo menos um produto', 'error'); return; }
    setSaving(true);
    try {
      const products = productIds.map(pid => {
        const cfg = selectedProducts[pid];
        return {
          productId: pid,
          promoPrice: cfg.mode === 'promoPrice' && cfg.promoPrice ? parseFloat(cfg.promoPrice) : null,
          discountType: cfg.mode === 'discount' ? cfg.discountType : null,
          discountValue: cfg.mode === 'discount' && cfg.discountValue ? parseFloat(cfg.discountValue) : null,
          highlightColor: cfg.highlightColor || null,
        };
      });
      const data = { ...form, products, productIds };
      if (isEditing && editingId) {
        await api.put('/campaigns', { id: editingId, ...data });
        toast('Campanha atualizada!', 'success');
      } else {
        await api.post('/campaigns', data);
        toast('Campanha criada!', 'success');
      }
      closeModal(); mutate();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao salvar', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta campanha?')) return;
    try { await api.delete('/campaigns', { data: { id } }); toast('Campanha excluída!', 'success'); mutate(); }
    catch { toast('Erro ao excluir', 'error'); }
  };

  const toggleProduct = (pid: string) => {
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (next[pid]) { delete next[pid]; } else { next[pid] = { ...emptyProductConfig }; }
      return next;
    });
  };

  const updateProductMode = (pid: string, mode: 'promoPrice' | 'discount') => {
    setSelectedProducts(prev => ({ ...prev, [pid]: { ...prev[pid], mode } }));
  };

  const updateProductPrice = (pid: string, price: string) => {
    setSelectedProducts(prev => ({ ...prev, [pid]: { ...prev[pid], promoPrice: price } }));
  };

  const updateProductDiscountType = (pid: string, discountType: string) => {
    setSelectedProducts(prev => ({ ...prev, [pid]: { ...prev[pid], discountType } }));
  };

  const updateProductDiscountValue = (pid: string, discountValue: string) => {
    setSelectedProducts(prev => ({ ...prev, [pid]: { ...prev[pid], discountValue } }));
  };

  const updateProductColor = (pid: string, color: string) => {
    setSelectedProducts(prev => ({ ...prev, [pid]: { ...prev[pid], highlightColor: color } }));
  };

  const formatDiscount = (c: Campaign) => {
    return c.discountType === 'percentage' ? `${c.discountValue}%` : formatBRL(c.discountValue);
  };

  const isActive = (c: Campaign) => {
    if (!c.active) return false;
    const now = new Date();
    if (c.startDate && new Date(c.startDate) > now) return false;
    if (c.endDate && new Date(c.endDate) < now) return false;
    return true;
  };

  const selectedCount = Object.keys(selectedProducts).length;

  return (
    <AuthGuard>
      <Head><title>Campanhas - Admin - Xananas&apos; Garden</title></Head>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 min-w-0 pb-20 lg:pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Megaphone size={24} className="text-[#de818d]" />
                <h1 className="text-2xl font-bold text-gray-800">Campanhas</h1>
                <span className="text-sm text-gray-400">({campaigns.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><GridFour size={18} /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><List size={18} /></button>
                </div>
                <button onClick={openCreate}
                  className="flex items-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2 px-4 rounded-lg text-sm">
                  <Plus size={16} /> Nova Campanha
                </button>
              </div>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Megaphone size={56} className="mx-auto mb-3 text-gray-200" />
                <p>Nenhuma campanha criada</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Campanha</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Desconto</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Produtos</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Período</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map(c => (
                      <tr key={c.id} onClick={() => openEdit(c)} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {c.heroImage ? (
                              <img src={c.heroImage} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Megaphone size={14} className="text-gray-300" /></div>
                            )}
                            <span className="font-medium text-gray-800">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{formatDiscount(c)} global</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{c.products.length}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {c.startDate && c.endDate ? `${new Date(c.startDate).toLocaleDateString('pt-BR')} → ${new Date(c.endDate).toLocaleDateString('pt-BR')}` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isActive(c) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {isActive(c) ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg"><Pencil size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map(c => (
                  <div key={c.id} onClick={() => openEdit(c)}
                    className="bg-white rounded-xl border border-gray-100 p-5 hover:border-[#de818d]/30 hover:shadow-md transition-all cursor-pointer">
                    {c.heroImage && (
                      <div className="rounded-lg overflow-hidden mb-3 h-28">
                        <img src={c.heroImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{c.name}</h3>
                        {c.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2" dangerouslySetInnerHTML={{ __html: c.description }} />}
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isActive(c) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {isActive(c) ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex items-center gap-1 text-sm font-bold text-[#de818d]">
                        {c.discountType === 'percentage' ? <Percent size={14} /> : <Money size={14} />}
                        {formatDiscount(c)} global
                      </span>
                      <span className="text-xs text-gray-400">{c.products.length} produto{c.products.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.products.slice(0, 5).map((cp: CampaignProductItem) => (
                        <div key={cp.id} className="relative">
                          {cp.product.images?.[0]?.image ? (
                            <img src={cp.product.images[0].image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200"><ImageIcon size={12} className="text-gray-400" /></div>
                          )}
                          {cp.promoPrice != null && (
                            <span className="absolute -bottom-1 -right-1 bg-[#de818d] text-white text-[8px] font-bold px-1 rounded-full leading-tight">{cp.promoPrice.toFixed(0)}</span>
                          )}
                        </div>
                      ))}
                      {c.products.length > 5 && <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 font-medium">+{c.products.length - 5}</div>}
                    </div>
                    {c.startDate && c.endDate && <p className="text-[10px] text-gray-400">{new Date(c.startDate).toLocaleDateString('pt-BR')} → {new Date(c.endDate).toLocaleDateString('pt-BR')}</p>}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL — Create / Edit Campaign */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Editar Campanha' : 'Nova Campanha'}</h2>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowPreview(true)} disabled={selectedCount === 0 && !form.heroImage && !form.modalImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-[#de818d] hover:bg-pink-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                  <Eye size={14} /> Visualizar modal
                </button>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da campanha *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="Ex: Promoção de Primavera" />
              </div>

              {/* Description — Rich Text Editor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-gray-400 font-normal">(Rich Text)</span></label>
                <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#de818d]">
                  <TipTapEditor
                    value={form.description}
                    onChange={html => setForm(p => ({ ...p, description: html }))}
                    placeholder="Descreva a campanha com formatação rica..."
                  />
                </div>
              </div>

              {/* Hero Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de Fundo da Campanha</label>
                <p className="text-[10px] text-gray-400 mb-2">Aparece como background no hero e no modal de campanha</p>
                {form.heroImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={form.heroImage} alt="Hero" className="w-full h-40 object-cover" />
                    <button onClick={() => setEditingHero(true)}
                      className="absolute top-2 right-10 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70" title="Editar imagem"><Pencil size={14} /></button>
                    <button onClick={() => setForm(p => ({ ...p, heroImage: '' }))}
                      className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70"><X size={14} /></button>
                  </div>
                ) : (
                  <ImageDropzone onFiles={files => files[0] && uploadHeroFile(files[0], 'heroImage')} multiple={false}
                    activeClassName="border-[#de818d] bg-pink-50 ring-2 ring-[#de818d]/40">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#de818d] hover:bg-pink-50/50 transition-colors">
                      <Upload size={24} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Clique para enviar imagem</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">ou arraste e solte, ou cole (Ctrl+V)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'heroImage')} />
                    </label>
                  </ImageDropzone>
                )}
              </div>

              {/* Global Discount */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Desconto Global (fallback)</p>
                <p className="text-[10px] text-gray-400 mb-3">Aplicado a produtos sem preço promocional individual</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]">
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <input type="number" step="0.01" min="0" value={form.discountValue || ''}
                      onChange={e => setForm(p => ({ ...p, discountValue: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                      placeholder="10" />
                  </div>
                </div>
              </div>

              {/* Theme Colors — 4-color palette: destaque, brilho, texto, fundo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor destaque</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.themeColor} onChange={e => setForm(p => ({ ...p, themeColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <input type="text" value={form.themeColor} onChange={e => setForm(p => ({ ...p, themeColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor de brilho (glow)</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.glowColor || form.themeColor} onChange={e => setForm(p => ({ ...p, glowColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <input type="text" value={form.glowColor} onChange={e => setForm(p => ({ ...p, glowColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" placeholder={form.themeColor} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Usada no brilho da borda dos cards de produto. Vazio = usa a cor destaque.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor de texto</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.textColor} onChange={e => setForm(p => ({ ...p, textColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <input type="text" value={form.textColor} onChange={e => setForm(p => ({ ...p, textColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor de fundo</label>
                  <div className="flex gap-2">
                    <input type="color" value={form.bgColor} onChange={e => setForm(p => ({ ...p, bgColor: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <input type="text" value={form.bgColor} onChange={e => setForm(p => ({ ...p, bgColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                  </div>
                </div>
              </div>

              {/* Quick Palette — each preset maps its 4 colors to destaque/brilho/texto/fundo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paletas Rápidas</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTES.map(palette => (
                    <button key={palette.name} onClick={() => setForm(p => ({ ...p, themeColor: palette.colors[0], glowColor: palette.colors[1], bgColor: palette.colors[3] }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-[#de818d] transition-colors text-xs text-gray-600"
                      title={palette.name}>
                      {palette.colors.map((c, i) => (
                        <span key={i} className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                      ))}
                      <span className="ml-1">{palette.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
                </div>
              </div>

              {/* Products with per-product promo price + color */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Produtos da Campanha</label>
                  <span className="text-xs text-gray-400">{selectedCount} selecionados</span>
                </div>
                <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="Buscar produto..." />

                {selectedCount > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-2 max-h-60 overflow-y-auto">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Produtos selecionados</p>
                    {Object.keys(selectedProducts).map(pid => {
                      const product = allProducts.find((p: Product) => p.id === pid);
                      if (!product) return null;
                      const config = selectedProducts[pid];
                      return (
                        <div key={pid} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-3 mb-2">
                            {product.images?.[0]?.image ? (
                              <img src={product.images[0].image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><ImageIcon size={14} className="text-gray-400" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-700 truncate">{product.name}</p>
                              <p className="text-[10px] text-gray-400">Original: {formatBRL(product.price || 0)}</p>
                            </div>
                            <button onClick={() => toggleProduct(pid)} className="p-1 text-gray-400 hover:text-red-500 rounded" title="Remover"><X size={12} /></button>
                          </div>
                          {/* Discount mode: fixed promo price OR percentage/fixed discount */}
                          <div className="flex items-center gap-1 mb-2 bg-gray-100 rounded-lg p-0.5 w-fit">
                            <button type="button" onClick={() => updateProductMode(pid, 'promoPrice')}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${config.mode === 'promoPrice' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-500'}`}>
                              Preço promo
                            </button>
                            <button type="button" onClick={() => updateProductMode(pid, 'discount')}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${config.mode === 'discount' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-500'}`}>
                              Desconto %/R$
                            </button>
                          </div>
                          {config.mode === 'promoPrice' ? (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] text-gray-500 w-16">Preço promo:</span>
                              <div className="relative flex-1">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">R$</span>
                                <input type="number" step="0.01" min="0" value={config.promoPrice}
                                  onChange={e => updateProductPrice(pid, e.target.value)}
                                  className="w-full pl-7 pr-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#de818d]"
                                  placeholder="Opcional" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] text-gray-500 w-16">Desconto:</span>
                              <select value={config.discountType} onChange={e => updateProductDiscountType(pid, e.target.value)}
                                className="border border-gray-200 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#de818d]">
                                <option value="percentage">%</option>
                                <option value="fixed">R$</option>
                              </select>
                              <input type="number" step="0.01" min="0" value={config.discountValue}
                                onChange={e => updateProductDiscountValue(pid, e.target.value)}
                                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#de818d]"
                                placeholder={config.discountType === 'percentage' ? '20' : '10.00'} />
                            </div>
                          )}
                          {/* Color picker with palette presets */}
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] text-gray-500 w-16 pt-1">Cor destaque:</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Preset colors from palettes */}
                                {COLOR_PALETTES.slice(0, 4).map(palette => (
                                  <button key={palette.name} onClick={() => updateProductColor(pid, palette.colors[0])}
                                    className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${config.highlightColor === palette.colors[0] ? 'border-gray-800 scale-110' : 'border-gray-200'}`}
                                    style={{ backgroundColor: palette.colors[0] }} title={palette.name} />
                                ))}
                                {/* Custom color picker */}
                                <div className="relative">
                                  <input type="color" value={config.highlightColor || '#de818d'}
                                    onChange={e => updateProductColor(pid, e.target.value)}
                                    className="w-5 h-5 rounded-full border border-gray-200 cursor-pointer" />
                                </div>
                                {config.highlightColor && (
                                  <button onClick={() => updateProductColor(pid, '')} className="text-[9px] text-gray-400 hover:text-red-500">limpar</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                  {filteredProducts.length === 0 ? (
                    <p className="p-4 text-center text-gray-400 text-sm">Nenhum produto encontrado</p>
                  ) : (
                    filteredProducts.map((p: Product) => {
                      const isSelected = !!selectedProducts[p.id];
                      return (
                        <button key={p.id} onClick={() => toggleProduct(p.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-[#de818d]/5 border-l-2 border-[#de818d]' : 'hover:bg-gray-50 border-l-2 border-transparent'}`}>
                          {p.images?.[0]?.image ? (
                            <img src={p.images[0].image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0"><ImageIcon size={10} className="text-gray-400" /></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400">{formatBRL(p.price || 0)}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-[#de818d] bg-[#de818d]' : 'border-gray-300'}`}>
                            {isSelected && <Check size={10} className="text-white" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))}
                  className="w-4 h-4 text-[#de818d] rounded" />
                <label className="text-sm text-gray-700">Campanha ativa</label>
              </div>
            </div>

            <div className="flex gap-2 p-4 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={handleSubmit} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                {saving ? <><AnimatedLogo size={14} /> Salvando...</> : isEditing ? 'Atualizar' : 'Criar Campanha'}
              </button>
              <button type="button" onClick={closeModal}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW — live preview of the campaign modal as the customer would see it */}
      {showPreview && (
        <CampaignModalView
          campaign={previewCampaign as any}
          onClose={() => setShowPreview(false)}
          onDontShowAgain={() => setShowPreview(false)}
          onGoToCampaign={() => setShowPreview(false)}
        />
      )}

      {editingHero && form.heroImage && (
        <ImageEditorModal
          src={form.heroImage}
          aspectRatio={21 / 9}
          exportWidth={1920}
          title="Editar imagem da campanha"
          onCancel={() => setEditingHero(false)}
          onSave={handleEditedHero}
        />
      )}
    </AuthGuard>
  );
};

export default Campanhas;
