import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { X, FloppyDisk, Upload, Trash, CaretUp, CaretDown, CheckSquare, Square } from 'phosphor-react';
import { api } from '../../lib/api';
import { useToast } from '../Toast';
import AnimatedLogo from '../AnimatedLogo';
import TipTapEditor from '../TipTapEditor';
import ImageDropzone from '../ImageDropzone';
import { useGlobalPaste } from '../../hooks/useGlobalPaste';

interface ProductImage {
  id: string;
  image: string;
  order?: number;
}

interface Category {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
  isDefault: boolean;
  maxInstallments: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceNegotiable?: boolean;
  note?: string;
  amount: number;
  published: boolean;
  videoUrl?: string;
  videoPosition?: number;
  categoryId: string;
  category: Category;
  categories?: Category[];
  paymentMethods?: PaymentMethod[];
  images: ProductImage[];
  maxInstallments?: number;
  installmentInterest?: boolean;
}

interface Props {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
}

const InlineProductEdit: React.FC<Props> = ({ product, onClose, onSaved, categories }) => {
  const { toast, ToastContainer } = useToast();
  const { data: paymentMethods = [] } = useSWR<PaymentMethod[]>('/payment-methods', (url: string) => api.get(url).then(r => r.data));
  const [form, setForm] = useState({
    name: '', description: '', price: 0, priceNegotiable: false, note: '', amount: 0,
    categoryId: '', categoryIds: [] as string[], paymentMethodIds: [] as string[], published: true, videoUrl: '',
    maxInstallments: 12, installmentInterest: false,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!product) return;
    const sorted = [...(product.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setExistingImages(sorted);
    const extraCategoryIds = (product.categories || []).map(c => c.id).filter(id => id !== product.categoryId);
    const paymentMethodIds = (product.paymentMethods || []).map(m => m.id);
    setForm({
      name: product.name, description: product.description, price: product.price || 0,
      priceNegotiable: product.priceNegotiable || false,
      note: product.note || '', amount: product.amount || 0, categoryId: product.categoryId,
      categoryIds: extraCategoryIds, paymentMethodIds,
      published: product.published, videoUrl: product.videoUrl || '',
      maxInstallments: product.maxInstallments || 12, installmentInterest: product.installmentInterest || false,
    });
    setSelectedFiles([]); setPreviewImages([]);
  }, [product]);

  const addFiles = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewImages(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
  };

  // Ctrl+V anywhere in the modal inserts the pasted image, regardless of what has focus
  useGlobalPaste(!!product, addFiles);

  const uploadImages = async (): Promise<{ url: string }[]> => {
    if (selectedFiles.length === 0) return [];
    const fd = new FormData();
    selectedFiles.forEach(f => fd.append('images', f));
    setIsUploading(true);
    try {
      const r = await fetch('/api/v1/uploads', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      return d.images;
    } finally { setIsUploading(false); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Nome é obrigatório', 'error'); return; }
    setSaving(true);
    try {
      let imageData: { url: string }[] = [];
      if (selectedFiles.length > 0) imageData = await uploadImages();

      // Stock quantity is not editable here — only via Estoque (entrada/saída)
      const { amount, ...formNoAmount } = form;
      const data = {
        ...formNoAmount,
        imageUrls: imageData.map(i => i.url),
      };

      await api.put(`/products/${product!.id}`, data);

      // Reorder existing + new images
      const allImages = [...existingImages, ...imageData.map((d, i) => ({ id: `new-${i}`, image: d.url, order: existingImages.length + i }))];
      if (allImages.length > 0) {
        await api.patch(`/products/${product!.id}`, {
          imageOrders: allImages.map((img, idx) => ({ id: img.id, order: idx })),
          videoPosition: 99,
        });
      }

      toast('Produto atualizado!', 'success');
      onSaved(); onClose();
    } catch (err: any) {
      toast(err.response?.data?.error || err.message || 'Erro ao salvar', 'error');
    } finally { setSaving(false); }
  };

  const removeNewImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string) => {
    try {
      await api.delete(`/uploads/${imageId}`);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast('Imagem removida', 'success');
    } catch { toast('Erro ao remover', 'error'); }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">Editar Produto</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <ToastContainer />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <TipTapEditor value={form.description} onChange={v => setForm(prev => ({ ...prev, description: v }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <input type="number" value={form.price} onChange={e => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} step="0.01" min="0"
                disabled={form.priceNegotiable}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d] disabled:bg-gray-100 disabled:text-gray-400" />
              <label className="flex items-center gap-2 mt-1.5">
                <input type="checkbox" checked={form.priceNegotiable}
                  onChange={e => setForm(prev => ({ ...prev, priceNegotiable: e.target.checked }))}
                  className="w-4 h-4 text-[#de818d] rounded" />
                <span className="text-xs text-gray-600">Preço a negociar</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
              <input type="number" value={form.amount} disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed" />
              <p className="text-[10px] text-gray-400 mt-1">Ajuste em Estoque → Entrada/Saída</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select value={form.categoryId} onChange={e => setForm(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]">
                <option value="">Selecione</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vídeo (YouTube URL)</label>
              <input value={form.videoUrl} onChange={e => setForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                placeholder="https://youtube.com/watch?v=..." />
            </div>
          </div>

          {categories.filter(c => c.id !== form.categoryId).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorias adicionais <span className="text-gray-400 font-normal">(clique para marcar)</span></label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg">
                {categories.filter(c => c.id !== form.categoryId).map(c => {
                  const checked = form.categoryIds.includes(c.id);
                  return (
                    <button key={c.id} type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        categoryIds: checked ? prev.categoryIds.filter(id => id !== c.id) : [...prev.categoryIds, c.id],
                      }))}
                      className={`flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        checked ? 'bg-[#de818d] border-[#de818d] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#de818d]/50 hover:bg-pink-50'
                      }`}>
                      {checked ? <CheckSquare size={15} weight="fill" /> : <Square size={15} />}
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {paymentMethods.filter(m => m.active).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formas de pagamento aceitas <span className="text-gray-400 font-normal">(clique para marcar)</span></label>
              <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg">
                {paymentMethods.filter(m => m.active).map(m => {
                  const checked = form.paymentMethodIds.includes(m.id);
                  return (
                    <button key={m.id} type="button"
                      onClick={() => setForm(prev => ({
                        ...prev,
                        paymentMethodIds: checked ? prev.paymentMethodIds.filter(id => id !== m.id) : [...prev.paymentMethodIds, m.id],
                      }))}
                      className={`flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        checked ? 'bg-[#de818d] border-[#de818d] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#de818d]/50 hover:bg-pink-50'
                      }`}>
                      {checked ? <CheckSquare size={15} weight="fill" /> : <Square size={15} />}
                      {m.name}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Nenhuma marcada = aceita todas as formas ativas.</p>
            </div>
          )}

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagens</label>
            <div className="flex flex-wrap gap-2">
              {existingImages.map((img, idx) => (
                <div key={img.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeExistingImage(img.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                  <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-black/50 text-white px-1 rounded">{idx + 1}</span>
                </div>
              ))}
              {previewImages.map((src, idx) => (
                <div key={`new-${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-green-200 group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={10} />
                  </button>
                  <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-green-500 text-white px-1 rounded">novo</span>
                </div>
              ))}
              <ImageDropzone onFiles={addFiles} activeClassName="border-[#de818d] bg-pink-50 ring-2 ring-[#de818d]/40">
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-[#de818d] flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-[8px] text-gray-400">Adicionar</span>
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </ImageDropzone>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.published} onChange={e => setForm(prev => ({ ...prev, published: e.target.checked }))}
                className="w-4 h-4 text-[#de818d] rounded" />
              <label className="text-sm text-gray-700">Publicado</label>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm hover:bg-gray-50">Cancelar</button>
            <button onClick={handleSave} disabled={saving || isUploading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 rounded-lg disabled:opacity-50 text-sm">
              {saving || isUploading ? <AnimatedLogo size={14} /> : <><FloppyDisk size={16} /> Salvar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InlineProductEdit;
