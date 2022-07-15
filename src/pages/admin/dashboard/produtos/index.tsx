import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../lib/api';
import { productSchema, ProductFormData } from '../../../../lib/validations';
import {
  Plus, X, Image as ImageIcon, Upload, Pencil, Trash, FloppyDisk,
  Link as LinkIcon, Eye, CaretUp, CaretDown, GridFour, List, CheckSquare, Square
} from 'phosphor-react';
import TipTapEditor from '../../../../components/TipTapEditor';
import AnimatedLogo from '../../../../components/AnimatedLogo';
import { toSlug } from '../../../../lib/slugify';
import Pagination from '../../../../components/Pagination';
import SearchInput from '../../../../components/SearchInput';
import ImageDropzone from '../../../../components/ImageDropzone';
import ImageEditorModal from '../../../../components/ImageEditorModal';
import { useGlobalPaste } from '../../../../hooks/useGlobalPaste';

interface Category { id: string; name: string; }
interface ProductImage { id: string; image: string; order?: number; }
interface PaymentMethod { id: string; name: string; active: boolean; isDefault: boolean; maxInstallments: number; }
interface Product {
  id: string; name: string; slug: string; description: string; price: number; priceNegotiable?: boolean;
  note?: string; amount: number; published: boolean; videoUrl?: string; tags?: string;
  videoPosition?: number; categoryId: string; category: Category; categories?: Category[];
  paymentMethods?: PaymentMethod[]; images: ProductImage[];
}

const AUTOSAVE_KEY = 'xananas_product_draft';

const emptyForm: ProductFormData = { name: '', description: '', price: 0, priceNegotiable: false, note: '', amount: 0, categoryId: '', categoryIds: [], paymentMethodIds: [], published: true, tags: '' };

const Produtos: React.FC = () => {
  const router = useRouter();
  const { toast, ToastContainer } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: categories = [], mutate: mutateCategories } = useSWR<Category[]>('/products-category', (url: string) => api.get(url).then(r => r.data), { revalidateOnFocus: true });
  const { data: products = [], mutate: mutateProducts } = useSWR<Product[]>('/products', (url: string) => api.get(url).then(r => r.data), { revalidateOnFocus: true });
  const { data: paymentMethods = [] } = useSWR<PaymentMethod[]>('/payment-methods', (url: string) => api.get(url).then(r => r.data), { revalidateOnFocus: true });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [videoUrl, setVideoUrl] = useState('');
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [videoPosition, setVideoPosition] = useState(99);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [editingImageIdx, setEditingImageIdx] = useState<number | null>(null);
  const [editingExistingIdx, setEditingExistingIdx] = useState<number | null>(null);
  const [replacingImage, setReplacingImage] = useState(false);

  // Prefill search from the global navbar search (?q=...)
  useEffect(() => {
    if (typeof router.query.q === 'string') setSearchTerm(router.query.q);
  }, [router.query.q]);

  // Save to localStorage helper
  const saveToDraft = (fd: ProductFormData, vu: string) => {
    const payload = { formData: fd, videoUrl: vu, savedAt: new Date().toISOString() };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
    setLastSaved(new Date().toLocaleTimeString('pt-BR'));
  };

  // Load draft when modal opens
  useEffect(() => {
    if (modalOpen && !isEditing) {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setFormData(data.formData || emptyForm);
          setVideoUrl(data.videoUrl || '');
          setLastSaved(data.savedAt ? new Date(data.savedAt).toLocaleTimeString('pt-BR') : null);
        } catch {}
      }
    }
  }, [modalOpen, isEditing]);

  // Auto-save on every change (debounced 1.5s)
  useEffect(() => {
    if (!modalOpen || isEditing) return;
    if (!formData.name && !formData.description) return;
    const timer = setTimeout(() => saveToDraft(formData, videoUrl), 1500);
    return () => clearTimeout(timer);
  }, [formData, videoUrl, modalOpen, isEditing]);



  const openCreateModal = () => {
    setIsEditing(false); setEditingId(null);
    setFormData({ ...emptyForm, paymentMethodIds: paymentMethods.filter(m => m.isDefault).map(m => m.id) });
    setVideoUrl('');
    setExistingImages([]); setPreviewImages([]); setSelectedFiles([]); setErrors({});
    setVideoPosition(99); setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setIsEditing(true); setEditingId(p.id); setVideoUrl(p.videoUrl || '');
    setVideoPosition(p.videoPosition ?? 99);
    const sorted = [...(p.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setExistingImages(sorted);
    const extraCategoryIds = (p.categories || []).map(c => c.id).filter(id => id !== p.categoryId);
    const paymentMethodIds = (p.paymentMethods || []).map(m => m.id);
    setFormData({ name: p.name, description: p.description, price: p.price || 0, priceNegotiable: p.priceNegotiable || false, note: p.note || '', amount: p.amount || 0, categoryId: p.categoryId, categoryIds: extraCategoryIds, paymentMethodIds, published: p.published, tags: p.tags || '' });
    setPreviewImages([]); setSelectedFiles([]); setErrors({}); setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false); setIsEditing(false); setEditingId(null); setErrors({});
    setPreviewImages([]); setSelectedFiles([]); setExistingImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearForm = () => {
    setFormData(emptyForm); setVideoUrl(''); setErrors({});
    setPreviewImages([]); setSelectedFiles([]); setExistingImages([]); setVideoPosition(99);
    localStorage.removeItem(AUTOSAVE_KEY);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast('Formulário limpo', 'success');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    if (errors[name as keyof ProductFormData]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setPreviewImages(files.map(file => URL.createObjectURL(file)));
  };

  const addFiles = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
    setPreviewImages(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  // Ctrl+V anywhere in the product modal inserts the pasted image, regardless of what has focus
  useGlobalPaste(modalOpen, addFiles);

  const removePreview = (index: number) => {
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditedImage = (blob: Blob) => {
    if (editingImageIdx === null) return;
    const idx = editingImageIdx;
    const file = new File([blob], `edited-${Date.now()}.webp`, { type: 'image/webp' });
    URL.revokeObjectURL(previewImages[idx]);
    const url = URL.createObjectURL(file);
    setSelectedFiles(prev => prev.map((f, i) => (i === idx ? file : f)));
    setPreviewImages(prev => prev.map((p, i) => (i === idx ? url : p)));
    setEditingImageIdx(null);
  };

  // Editing an already-saved image: upload the edited version, attach it to the product,
  // drop the old one, then put the new image back in the same carousel position.
  const handleEditedExistingImage = async (blob: Blob) => {
    if (editingExistingIdx === null || !editingId) return;
    const idx = editingExistingIdx;
    const oldImg = existingImages[idx];
    setEditingExistingIdx(null);
    setReplacingImage(true);
    try {
      const file = new File([blob], `edited-${Date.now()}.webp`, { type: 'image/webp' });
      const fd = new FormData();
      fd.append('images', file);
      const upRes = await fetch('/api/v1/uploads', { method: 'POST', body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) throw new Error(upData.error);
      const newUrl = upData.images[0].url;

      await api.put(`/products/${editingId}`, { imageUrls: [newUrl] });
      await api.delete(`/uploads/${oldImg.id}`);

      const fresh = await api.get(`/products/${editingId}`);
      const sorted: ProductImage[] = [...(fresh.data.images || [])].sort((a: ProductImage, b: ProductImage) => (a.order ?? 0) - (b.order ?? 0));
      const newImg = sorted.find(img => img.image === newUrl) || sorted[sorted.length - 1];
      const reordered = sorted.filter(img => img.id !== newImg.id);
      reordered.splice(idx, 0, newImg);
      setExistingImages(reordered);
      await api.patch(`/products/${editingId}`, {
        imageOrders: reordered.map((img, i) => ({ id: img.id, order: i })),
        videoPosition,
      });
      toast('Imagem atualizada!', 'success');
      mutateProducts();
    } catch (err: any) {
      toast(err.response?.data?.error || err.message || 'Erro ao editar imagem', 'error');
    } finally {
      setReplacingImage(false);
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setExistingImages(prev => {
      const arr = [...prev];
      const ti = direction === 'up' ? index - 1 : index + 1;
      if (ti < 0 || ti >= arr.length) return prev;
      [arr[index], arr[ti]] = [arr[ti], arr[index]];
      return arr;
    });
  };

  const deleteExistingImage = async (imageId: string) => {
    if (!confirm('Excluir esta imagem?')) return;
    try { await api.delete(`/uploads/${imageId}`); setExistingImages(prev => prev.filter(img => img.id !== imageId)); toast('Imagem excluída', 'success'); }
    catch { toast('Erro ao excluir imagem', 'error'); }
  };

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
    } catch (e: any) { throw new Error(e.message || 'Upload failed'); }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrors({});
    const result = productSchema.safeParse(formData);
    if (!result.success) {
      const fe: any = {};
      result.error.errors.forEach(err => { fe[err.path[0]] = err.message; });
      setErrors(fe); toast('Corrija os erros no formulário', 'error'); return;
    }
    try {
      let imageData: { url: string }[] = [];
      if (selectedFiles.length > 0) imageData = await uploadImages();
      const productData = {
        ...formData,
        slug: toSlug(formData.name),
        videoUrl: videoUrl || undefined,
        imageUrls: imageData.map(i => i.url),
      };
      if (isEditing && editingId) {
        // Stock quantity is not editable from the product form — only via Estoque (entrada/saída)
        const { amount, ...productDataNoAmount } = productData;
        await api.put(`/products/${editingId}`, productDataNoAmount);
        const imageOrders = existingImages.map((img, idx) => ({ id: img.id, order: idx }));
        await api.patch(`/products/${editingId}`, { imageOrders, videoPosition });
        toast('Produto atualizado!', 'success');
      } else {
        await api.post('/products', productData);
        toast('Produto cadastrado!', 'success');
        localStorage.removeItem(AUTOSAVE_KEY);
      }
      closeModal(); mutateProducts();
    } catch (err: any) {
      toast(err.response?.data?.error || err.message || 'Erro ao salvar', 'error');
    }
  };

  const handleTogglePublished = async (id: string, current: boolean) => {
    try {
      await api.put(`/products/${id}`, { published: !current });
      toast(`Produto ${current ? 'desativado' : 'ativado'}!`, 'success');
      mutateProducts();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Erro ao alterar status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    try { await api.delete(`/products/${id}`); toast('Produto excluído!', 'success'); mutateProducts(); }
    catch (err: any) { toast(err.response?.data?.error || 'Erro ao excluir', 'error'); }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  // Filter + paginate
  const filtered = searchTerm
    ? products.filter((p: any) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset page when search changes
  const handleSearch = (v: string) => { setSearchTerm(v); setCurrentPage(1); };

  return (
    <AuthGuard>
      <Head><title>Produtos - Admin - Xananas&apos; Garden</title></Head>
      <ToastContainer />
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 pb-20 lg:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ImageIcon size={24} className="text-[#de818d]" />
                <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
                <span className="text-sm text-gray-400">({filtered.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><GridFour size={18} /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#de818d]' : 'text-gray-400'}`}><List size={18} /></button>
                </div>
                <button onClick={openCreateModal}
                  className="flex items-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                  <Plus size={18} /> Novo Produto
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <SearchInput value={searchTerm} onChange={handleSearch} placeholder="Buscar por nome, categoria ou descrição..." className="max-w-md" />
            </div>

            {/* Products */}
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <ImageIcon size={56} className="mx-auto mb-3 text-gray-200" />
                <p>Nenhum produto cadastrado</p>
                <button onClick={openCreateModal} className="mt-4 text-sm text-[#de818d] hover:underline">Cadastrar primeiro produto</button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginated.map(p => (
                  <div key={p.id} onClick={() => openEditModal(p)}
                    className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-[#de818d]/30 hover:shadow-md transition-all cursor-pointer group">
                    <div className="aspect-[4/3] bg-gray-100 relative">
                      {p.images?.[0] ? (
                        <img src={p.images[0].image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} className="text-gray-300" /></div>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleTogglePublished(p.id, p.published); }}
                        className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${p.published ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {p.published ? 'Ativo' : 'Inativo'}
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">{p.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{p.category?.name || 'Sem categoria'}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-bold text-[#de818d]">{p.priceNegotiable ? 'A negociar' : formatPrice(p.price || 0)}</span>
                        <span className="text-xs text-gray-400">Estoque: {p.amount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Produto</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Categoria</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Preço</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Estoque</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginated.map(p => (
                      <tr key={p.id} onClick={() => openEditModal(p)} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {p.images?.[0] ? <img src={p.images[0].image} alt="" className="w-9 h-9 rounded object-cover" /> :
                              <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center"><ImageIcon size={14} className="text-gray-400" /></div>}
                            <span className="font-medium text-gray-800">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{p.priceNegotiable ? 'A negociar' : formatPrice(p.price || 0)}</td>
                        <td className="px-4 py-3 text-xs">{p.amount || 0}</td>
                        <td className="px-4 py-3">
                          <button onClick={(e) => { e.stopPropagation(); handleTogglePublished(p.id, p.published); }}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors ${p.published ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {p.published ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEditModal(p)} className="p-2 text-gray-400 hover:text-[#de818d] hover:bg-pink-50 rounded-lg"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={(v) => { setPerPage(v); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* MODAL — Create / Edit Product */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between flex-wrap gap-y-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                {!isEditing && (
                  <>
                    {lastSaved && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        ✓ Salvo {lastSaved}
                      </span>
                    )}
                    <button onClick={clearForm} className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 whitespace-nowrap">🗑️ Limpar</button>
                  </>
                )}
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#de818d]`}
                    placeholder="Nome do produto" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  {/* Slug preview */}
                  {formData.name && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Eye size={10} /> /catalogo/{toSlug(formData.name)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select name="categoryId" value={formData.categoryId} onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm ${errors.categoryId ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#de818d]`}>
                    <option value="">Selecione</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
                </div>
              </div>

              {categories.filter(c => c.id !== formData.categoryId).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categorias adicionais <span className="text-gray-400 font-normal">(clique para marcar)</span></label>
                  <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg">
                    {categories.filter(c => c.id !== formData.categoryId).map(c => {
                      const checked = (formData.categoryIds || []).includes(c.id);
                      return (
                        <button key={c.id} type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            categoryIds: checked
                              ? (prev.categoryIds || []).filter(id => id !== c.id)
                              : [...(prev.categoryIds || []), c.id],
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
                  <p className="text-xs text-gray-400 mt-1">O produto também aparecerá nessas categorias, além da principal.</p>
                </div>
              )}

              {paymentMethods.filter(m => m.active).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formas de pagamento aceitas <span className="text-gray-400 font-normal">(clique para marcar)</span></label>
                  <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg">
                    {paymentMethods.filter(m => m.active).map(m => {
                      const checked = (formData.paymentMethodIds || []).includes(m.id);
                      return (
                        <button key={m.id} type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            paymentMethodIds: checked
                              ? (prev.paymentMethodIds || []).filter(id => id !== m.id)
                              : [...(prev.paymentMethodIds || []), m.id],
                          }))}
                          className={`flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            checked ? 'bg-[#de818d] border-[#de818d] text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-[#de818d]/50 hover:bg-pink-50'
                          }`}>
                          {checked ? <CheckSquare size={15} weight="fill" /> : <Square size={15} />}
                          {m.name}{m.maxInstallments > 1 ? ` (até ${m.maxInstallments}x)` : ''}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Nenhuma marcada = aceita todas as formas ativas. Gerencie as formas em Formas de Pagamento.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição * <span className="text-gray-400 font-normal">(Markdown)</span></label>
                <TipTapEditor value={formData.description} onChange={html => setFormData(prev => ({ ...prev, description: html }))} placeholder="Descrição do produto" />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" min="0"
                    disabled={formData.priceNegotiable}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm ${errors.price ? 'border-red-400 bg-red-50' : 'border-gray-200'} disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#de818d]`} />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                  <label className="flex items-center gap-2 mt-1.5">
                    <input type="checkbox" checked={formData.priceNegotiable}
                      onChange={e => setFormData(prev => ({ ...prev, priceNegotiable: e.target.checked }))}
                      className="w-4 h-4 text-[#de818d] rounded" />
                    <span className="text-xs text-gray-600">Preço a negociar</span>
                  </label>
                  {formData.priceNegotiable ? (
                    <p className="text-[10px] text-gray-400 mt-1">O catálogo mostrará &quot;A negociar&quot; em vez do preço.</p>
                  ) : formData.price > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Até {(formData as any).maxInstallments || 12}x de {formatPrice(formData.price / ((formData as any).maxInstallments || 12))}{' '}
                      {(formData as any).installmentInterest ? 'com juros' : 'sem juros'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleChange} min="0"
                    disabled={isEditing}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm ${errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-200'} disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#de818d]`} />
                  {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                  {isEditing && (
                    <p className="text-[10px] text-gray-400 mt-1">Ajuste o estoque em Estoque → Entrada/Saída</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <input type="text" name="note" value={formData.note || ''} onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]" placeholder="Opcional" />
                </div>
              </div>

              {/* Installment Options */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                <div className="w-full sm:w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Máx. parcelas</label>
                  <select value={(formData as any).maxInstallments || 12}
                    onChange={e => setFormData(prev => ({ ...prev, maxInstallments: parseInt(e.target.value) } as any))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <option key={n} value={n}>{n}x</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" checked={(formData as any).installmentInterest || false}
                    onChange={e => setFormData(prev => ({ ...prev, installmentInterest: e.target.checked } as any))}
                    className="w-4 h-4 text-[#de818d] rounded" />
                  <label className="text-sm text-gray-700">Com juros</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><LinkIcon size={14} className="inline" /> URL do Vídeo (YouTube)</label>
                <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="https://www.youtube.com/watch?v=..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags <span className="text-gray-400 font-normal">(separadas por vírgula)</span></label>
                <input type="text" name="tags" value={(formData as any).tags || ''} onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#de818d]"
                  placeholder="rosa-do-deserto, suculenta, presente" />
                <p className="text-[10px] text-gray-400 mt-1">Usadas para sugerir produtos relacionados na página do produto.</p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><ImageIcon size={14} className="inline" /> Imagens</label>
                {isEditing && existingImages.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <p className="text-xs text-gray-400">Ordem do carrossel (↑↓)</p>
                    {existingImages.map((img, idx) => (
                      <div key={img.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <button type="button" onClick={() => setEditingExistingIdx(idx)} disabled={replacingImage}
                          className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 group disabled:opacity-50" title="Editar imagem">
                          <img src={img.image} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                            <Pencil size={14} className="text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                        <span className="text-xs text-gray-600 flex-1">Imagem {idx + 1}</span>
                        <div className="flex flex-col gap-0.5">
                          <button type="button" onClick={() => moveImage(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><CaretUp size={14} /></button>
                          <button type="button" onClick={() => moveImage(idx, 'down')} disabled={idx === existingImages.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><CaretDown size={14} /></button>
                        </div>
                        <button type="button" onClick={() => deleteExistingImage(img.id)} className="p-1 text-red-400 hover:text-red-600"><Trash size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <ImageDropzone onFiles={addFiles} activeClassName="border-[#de818d] bg-pink-50 ring-2 ring-[#de818d]/40">
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#de818d] hover:bg-pink-50 transition-colors">
                    <Upload size={24} className="mx-auto text-gray-400 mb-1" />
                    <p className="text-xs text-gray-500">{isEditing ? 'Adicionar mais imagens' : 'Selecionar imagens'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">ou arraste e solte, ou cole (Ctrl+V)</p>
                  </div>
                </ImageDropzone>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                {previewImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {previewImages.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <button type="button" onClick={() => setEditingImageIdx(idx)} title="Editar imagem">
                          <img src={preview} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg flex items-center justify-center transition-colors">
                            <Pencil size={16} className="text-white opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                        <button type="button" onClick={() => removePreview(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button type="submit" disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#de818d] hover:bg-[#c96a76] text-white font-medium py-2.5 px-5 rounded-lg disabled:opacity-50 transition-colors text-sm">
                  {isUploading ? <><AnimatedLogo size={14} /> Enviando...</> : isEditing ? <><FloppyDisk size={16} /> Atualizar</> : <><Plus size={16} /> Cadastrar</>}
                </button>
                <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingImageIdx !== null && previewImages[editingImageIdx] && (
        <ImageEditorModal
          src={previewImages[editingImageIdx]}
          aspectRatio={1}
          exportWidth={900}
          title="Editar imagem do produto"
          onCancel={() => setEditingImageIdx(null)}
          onSave={handleEditedImage}
        />
      )}

      {editingExistingIdx !== null && existingImages[editingExistingIdx] && (
        <ImageEditorModal
          src={existingImages[editingExistingIdx].image}
          aspectRatio={1}
          exportWidth={900}
          title="Editar imagem do produto"
          onCancel={() => setEditingExistingIdx(null)}
          onSave={handleEditedExistingImage}
        />
      )}
    </AuthGuard>
  );
};

export default Produtos;
