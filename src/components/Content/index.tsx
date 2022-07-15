import Head from 'next/head';
import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChatCircleDots, Package, ArrowRight, List, SquaresFour } from 'phosphor-react';
import { openWhatsApp } from '../../lib/settings';
import { useAuth } from '../../hooks/useAuth';
import AnimatedLogo from '../AnimatedLogo';

interface ProductImage {
  id: string;
  image: string;

}

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  note?: string | null;
  amount: number;
  published: boolean;
  category: Category;
  images: ProductImage[];
}

interface ContentProps {
  selectedCategory?: string;
  sortBy?: string;
  search?: string;
}

type ViewMode = 'list' | 'grid';

const Content: React.FC<ContentProps> = ({ selectedCategory, sortBy, search }) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Load saved view preference
  useEffect(() => {
    const saved = localStorage.getItem('catalogViewMode') as ViewMode | null;
    if (saved === 'list' || saved === 'grid') {
      setViewMode(saved);
    }
  }, []);

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('catalogViewMode', mode);
  };

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('categoryId', selectedCategory);
        if (sortBy) params.set('sortBy', sortBy);

        const res = await fetch(`/api/v1/products?${params.toString()}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [selectedCategory, sortBy]);

  // Client-side search filtering
  const filteredProducts = useMemo(() => {
    if (!search || !search.trim()) return products;
    const term = search.toLowerCase().trim();
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.category?.name && p.category.name.toLowerCase().includes(term))
    );
  }, [products, search]);

  // Group products by category for grid view
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(p => {
      const catName = p.category?.name || 'Sem categoria';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(p);
    });
    return groups;
  }, [filteredProducts]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const handleWhatsApp = (product: Product) => {
    const message = `Olá! Tenho interesse no produto: *${product.name}*\nPreço: ${formatPrice(product.price || 0)}\nDescrição: ${product.description}\n\nGostaria de mais informações!`;
    openWhatsApp(message, user?.phone);
  };

  const productCount = filteredProducts.length;

  return (
    <div id="content" className="flex-1 min-w-0 max-w-5xl mx-auto">
      <Head>
        <title>Catálogo - Xananas&apos; Garden</title>
        <meta name="description" content="Conheça nossas rosas do deserto, vasos e acessórios para jardinagem." />
      </Head>

      {/* Header bar */}
      <div className="flex items-center justify-between mx-4 md:mx-10 lg:mx-20 mt-6 mb-0">
        <div>
          <h1 className="font-bold text-xl text-gray-800">Produtos</h1>
          {!loading && filteredProducts.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{productCount} produto{productCount !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* View toggle */}
        {!loading && filteredProducts.length > 0 && (
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => toggleView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'text-[#de818d]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vista em lista"
            >
              <List size={16} />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => toggleView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'text-[#de818d]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Vista em grade"
            >
              <SquaresFour size={16} />
              <span className="hidden sm:inline">Grade</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 mx-4 md:mx-10 lg:mx-20 mb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <AnimatedLogo size={50} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Nenhum produto encontrado</p>
            <p className="text-sm">Tente mudar a categoria ou filtro de ordenação.</p>
          </div>
        ) : viewMode === 'list' ? (
          /* ===== LIST VIEW ===== */
          <div className="flex flex-col gap-4 md:gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#de818d]/30 transition-all bg-white"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="relative w-full sm:w-44 md:w-48 h-44 sm:h-48 bg-gray-100 flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0].image}
                        alt={product.name}
                        layout="fill"
                        objectFit="cover"
                        sizes="(max-width: 640px) 100vw, 192px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={48} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-bold text-lg md:text-xl text-gray-800">{product.name}</h2>
                          <h3 className="text-sm text-[#de818d] font-medium">{product.category?.name}</h3>
                        </div>
                        <span className="hidden sm:inline bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
                          Estoque: {product.amount}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2 sm:line-clamp-3">{product.description}</p>
                      {product.note && (
                        <p className="text-xs text-gray-400 mt-1 italic">{product.note}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <h2 className="font-bold text-lg md:text-xl text-[#de818d]">
                          {formatPrice(product.price || 0)}
                        </h2>
                        <p className="text-xs text-green-600">à vista ou em até 12x</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/catalogo/${product.slug}`} className="flex items-center gap-1 btn-glass-pink-solid text-sm font-medium py-2 px-3 md:px-4 rounded-lg">
                          Ver detalhes
                          <ArrowRight size={14} />
                        </Link>
                        <button
                          onClick={() => handleWhatsApp(product)}
                          className="flex items-center gap-1.5 btn-glass-green-solid text-sm font-medium py-2 px-3 md:px-4 rounded-lg"
                          title="Enviar via WhatsApp"
                        >
                          <ChatCircleDots size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ===== GRID VIEW ===== */
          <div className="space-y-8">
            {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
              <div key={categoryName}>
                {/* Category header */}
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="font-bold text-base md:text-lg text-gray-800">{categoryName}</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {categoryProducts.length}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Desktop: grid */}
                <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryProducts.map(product => (
                    <GridCard
                      key={product.id}
                      product={product}
                      formatPrice={formatPrice}
                      onWhatsApp={handleWhatsApp}
                    />
                  ))}
                </div>

                {/* Mobile: horizontal scroll */}
                <div className="flex md:hidden gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
                  {categoryProducts.map(product => (
                    <div key={product.id} className="flex-shrink-0 w-64 snap-start">
                      <GridCard
                        product={product}
                        formatPrice={formatPrice}
                        onWhatsApp={handleWhatsApp}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ===== Grid Card Component ===== */
interface GridCardProps {
  product: Product;
  formatPrice: (price: number) => string;
  onWhatsApp: (product: Product) => void;
}

const GridCard: React.FC<GridCardProps> = ({ product, formatPrice, onWhatsApp }) => {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#de818d]/30 transition-all bg-white flex flex-col h-full">
      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-100">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0].image}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            sizes="(max-width: 768px) 256px, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-gray-300" />
          </div>
        )}

        {/* Stock badge */}
        <div className="absolute top-2 right-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            product.amount > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}>
            {product.amount > 0 ? `${product.amount} un.` : 'Esgotado'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 flex-1">{product.description}</p>

        <div className="mt-3">
          <p className="font-bold text-base text-[#de818d]">{formatPrice(product.price || 0)}</p>
          <p className="text-[10px] text-green-600">à vista ou em até 12x</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Link href={`/catalogo/${product.slug}`} className="flex-1 flex items-center justify-center gap-1 btn-glass-pink-solid text-xs font-medium py-2 rounded-lg">
            Detalhes
            <ArrowRight size={12} />
          </Link>
          <button
            onClick={() => onWhatsApp(product)}
            className="flex items-center justify-center btn-glass-green-solid text-white w-9 h-9 rounded-lg"
            title="WhatsApp"
          >
            <ChatCircleDots size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Content;
