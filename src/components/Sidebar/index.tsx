import React, { useEffect, useState } from 'react';
import { List, SlidersHorizontal, X, MapPin, NavigationArrow, ArrowSquareOut, Pencil, Check, Heart, TrendUp } from 'phosphor-react';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';

interface Category {
  id: string;
  name: string;
}

interface FavoriteItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image?: string | null;
}

interface SidebarProps {
  categories?: Category[];
  selectedCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  favorites?: FavoriteItem[];
  onShowFavorites?: () => void;
  showFavorites?: boolean;
  topWishlistedCount?: number;
}

const LAT = -5.775133;
const LNG = -35.277507;
const ADDRESS = 'Rua Bacharel Raimundo Mendes, 685, Novo Amarante, São Gonçalo do Amarante, RN';

// Embed URL with pin marker at exact coordinates
const MAPS_EMBED_MARKER = `https://maps.google.com/maps?q=${LAT},${LNG}&t=&z=17&ie=UTF8&iwloc=&output=embed`;

// Directions URL (opens Google Maps app or web with route)
const MAPS_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`;

// Open in Google Maps (view location)
const MAPS_OPEN = `https://www.google.com/maps?q=${LAT},${LNG}&z=17`;

const Sidebar: React.FC<SidebarProps> = ({
  categories: categoriesProp,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  isOpen,
  onClose,
  favorites = [],
  onShowFavorites,
  showFavorites,
  topWishlistedCount = 0,
}) => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(categoriesProp || []);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('xananas_auth_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.admin) setIsAdmin(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (categoriesProp && categoriesProp.length > 0) return;
    async function loadCategories() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/v1/products-category'),
          fetch('/api/v1/products'),
        ]);
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        if (!Array.isArray(catData)) return;
        // Only list categories that currently have a published product — a product's
        // primary category or any additional one it's linked to
        if (Array.isArray(prodData)) {
          const idsWithProducts = new Set<string>();
          prodData.forEach((p: any) => {
            if (!p.published) return;
            (p.categories?.length ? p.categories : [p.category]).forEach((c: any) => c?.id && idsWithProducts.add(c.id));
          });
          setCategories(catData.filter((c: Category) => idsWithProducts.has(c.id)));
        } else {
          setCategories(catData);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, [categoriesProp]);

  const saveCategory = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await api.put(`/products-category/${id}`, { name: editName.trim() });
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
      setEditingCategory(null);
    } catch {}
  };

  /**
   * When a category is clicked:
   * - If onCategoryChange prop exists (catalog page), use it
   * - Otherwise navigate to /catalogo with category filter
   */
  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId);
      onClose?.();
    } else {
      // Navigate to catalog page with category filter
      const url = categoryId ? `/catalogo?category=${categoryId}` : '/catalogo';
      router.push(url);
      onClose?.();
    }
  };

  const handleSortClick = (sortValue: string) => {
    if (onSortChange) {
      onSortChange(sortValue);
      onClose?.();
    } else {
      router.push(`/catalogo?sort=${sortValue}`);
      onClose?.();
    }
  };

  const sortOptions = [
    { value: '', label: 'Mais recentes' },
    { value: 'price_asc', label: 'Menor preço' },
    { value: 'price_desc', label: 'Maior preço' },
    { value: 'name', label: 'Nome (A-Z)' },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed lg:sticky top-0 lg:top-14 left-0 z-50 lg:z-auto
          h-screen lg:h-[calc(100vh-56px)]
          w-72 lg:w-60 lg:ml-[10%]
          bg-white lg:bg-transparent
          border-r lg:border-r-0 border-gray-200
          overflow-y-auto
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Filtros</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Categories */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <List size={18} className="text-[#de818d]" />
            <h3 className="font-semibold text-sm text-gray-800 uppercase tracking-wide">Categorias</h3>
          </div>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handleCategoryClick('')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                !selectedCategory
                  ? 'btn-glass-pink-solid font-medium'
                  : 'text-gray-600 hover:bg-[#de818d]/5'
              }`}
            >
              Todos
            </button>
            {categories.map(category => (
              <div key={category.id} className="flex items-center group">
                {editingCategory === category.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveCategory(category.id); if (e.key === 'Escape') setEditingCategory(null); }}
                      className="flex-1 px-2 py-1 border border-[#de818d] rounded text-sm focus:outline-none"
                      autoFocus />
                    <button onClick={() => saveCategory(category.id)} className="p-1 text-green-500 hover:bg-green-50 rounded">
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleCategoryClick(category.id)}
                      className={`flex-1 text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'btn-glass-pink-solid font-medium'
                          : 'text-gray-600 hover:bg-[#de818d]/5'
                      }`}>
                      {category.name}
                    </button>
                    {isAdmin && (
                      <button onClick={() => { setEditingCategory(category.id); setEditName(category.name); }}
                        className="p-1 text-gray-300 hover:text-[#de818d] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Pencil size={10} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Mais Curtidos — virtual category */}
          {topWishlistedCount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  if (onCategoryChange) {
                    onCategoryChange('__top_wishlisted');
                    onClose?.();
                  }
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selectedCategory === '__top_wishlisted'
                    ? 'btn-glass-pink-solid font-medium'
                    : 'text-gray-600 hover:bg-[#de818d]/5'
                }`}
              >
                <TrendUp size={14} className="text-[#de818d]" />
                <span>Mais curtidos</span>
                <span className="ml-auto text-[10px] bg-[#de818d]/10 text-[#de818d] px-1.5 py-0.5 rounded-full font-medium">
                  {topWishlistedCount}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <>
            <div className="mx-4 border-t border-gray-100" />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={18} className="text-red-400 fill-red-400" />
                <h3 className="font-semibold text-sm text-gray-800 uppercase tracking-wide">Meus Favoritos</h3>
                <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full font-medium">
                  {favorites.length}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {favorites.slice(0, 8).map(fav => (
                  <a
                    key={fav.productId}
                    href={`/catalogo/${fav.slug}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    {fav.image ? (
                      <img src={fav.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Heart size={10} className="text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700 truncate group-hover:text-[#de818d]">{fav.name}</p>
                      <p className="text-[10px] text-[#de818d]">R$ {(fav.price || 0).toFixed(2)}</p>
                    </div>
                  </a>
                ))}
                {favorites.length > 8 && (
                  <p className="text-[10px] text-gray-400 text-center mt-1">+{favorites.length - 8} mais</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="mx-4 border-t border-gray-100" />

        {/* Sorting */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={18} className="text-[#de818d]" />
            <h3 className="font-semibold text-sm text-gray-800 uppercase tracking-wide">Ordenar por</h3>
          </div>
          <div className="flex flex-col gap-0.5">
            {sortOptions.map(option => (
              <button
                key={option.value}
                onClick={() => handleSortClick(option.value)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  sortBy === option.value
                    ? 'btn-glass-pink-solid font-medium'
                    : 'text-gray-600 hover:bg-[#de818d]/5'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active filters summary (mobile) */}
        {(selectedCategory || sortBy) && (
          <div className="p-4 border-t border-gray-100 lg:hidden">
            <button
              onClick={() => {
                handleCategoryClick('');
                handleSortClick('');
              }}
              className="w-full py-2.5 text-sm text-[#de818d] border border-[#de818d]/30 rounded-lg hover:bg-[#de818d]/5 transition-colors backdrop-blur-sm"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* Divider */}
        <div className="mx-4 border-t border-gray-100" />

        {/* Map Section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-[#de818d]" />
            <h3 className="font-semibold text-sm text-gray-800 uppercase tracking-wide">Localização</h3>
          </div>

          {/* Map preview with marker */}
          <button
            onClick={() => setMapExpanded(true)}
            className="w-full rounded-xl overflow-hidden border border-gray-200 hover:border-[#de818d] transition-colors cursor-pointer group relative"
            title="Clique para ampliar o mapa"
          >
            <iframe
              src={MAPS_EMBED_MARKER}
              width="100%"
              height="140"
              style={{ border: 0, pointerEvents: 'none' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="group-hover:opacity-80 transition-opacity"
            />
            {/* Expand hint overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
              <span className="bg-white/90 text-xs text-gray-700 px-3 py-1.5 rounded-full shadow-sm font-medium">
                Clique para ampliar
              </span>
            </div>
          </button>

          {/* Address */}
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            📍 {ADDRESS}
          </p>

          {/* Delivery info */}
          <div className="mt-2 space-y-1.5">
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <NavigationArrow size={12} className="text-[#de818d] flex-shrink-0" />
              Entrega em até 2km de distância
            </p>
            <p className="text-[11px] text-gray-400">
              Negociamos entregas via aplicativos (iFood, Rappi, etc.)
            </p>
          </div>

          {/* Action links */}
          <div className="mt-3 flex flex-col gap-1.5">
            <a
              href={MAPS_DIRECTIONS}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full btn-glass-pink-solid text-xs font-medium py-2.5 rounded-lg"
            >
              <NavigationArrow size={14} />
              Como chegar
            </a>
            <a
              href={MAPS_OPEN}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full btn-glass-pink text-xs font-medium py-2.5 rounded-lg"
            >
              <ArrowSquareOut size={14} />
              Abrir no Google Maps
            </a>
          </div>
        </div>
      </aside>

      {/* Expanded Map Modal */}
      {mapExpanded && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMapExpanded(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[95vw] h-[85vh] max-w-5xl overflow-hidden flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#de818d]/10 rounded-lg flex items-center justify-center">
                  <MapPin size={18} className="text-[#de818d]" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Nossa Localização</h2>
                  <p className="text-xs text-gray-400">{ADDRESS}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={MAPS_DIRECTIONS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 btn-glass-pink-solid text-xs font-medium py-2 px-3 rounded-lg"
                >
                  <NavigationArrow size={14} />
                  Como chegar
                </a>
                <button
                  onClick={() => setMapExpanded(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {/* Full Map */}
            <div className="flex-1 min-h-0">
              <iframe
                src={MAPS_EMBED_MARKER}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
