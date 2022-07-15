import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../hooks/useWishlist';
import CartDrawer from '../../components/CartDrawer';
import { GetStaticProps, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import ChatBot from '../../components/ChatBot';
import CampaignHero from '../../components/CampaignHero';
import CampaignModal from '../../components/CampaignModal';
import InlineProductEdit from '../../components/InlineProductEdit';
import GitHubModal from '../../components/GitHubModal';
import ProductImagePager from '../../components/ProductImagePager';
import CampaignGlowFrame from '../../components/CampaignGlowFrame';
import { useAuth } from '../../hooks/useAuth';
import { getCurrentSeasonalTheme, applySeasonalTheme } from '../../hooks/useSeasonalTheme';
import { prisma } from '../../lib/prisma';
import { openWhatsApp } from '../../lib/settings';
import { buildProductInquiryMessage } from '../../lib/whatsappMessage';
import { getCampaignDisplayPrice } from '../../lib/campaignPricing';
import { ChatCircleDots, Package, List, SquaresFour, CaretLeft, CaretRight, PencilSimple, ShoppingCart, Heart } from 'phosphor-react';

const PRODUCTS_PER_PAGE = 12;

interface ProductImage {
  id: string;
  image: string;

}

interface Category {
  id: string;
  name: string;
}

interface Creator {
  id: string;
  name: string;
  avatar?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceNegotiable?: boolean;
  note?: string | null;
  amount: number;
  published: boolean;
  category: Category;
  categories: Category[];
  images: ProductImage[];
  createdBy?: Creator | null;
}

export const getStaticProps: GetStaticProps = async () => {
  const rawProducts = await prisma.product.findMany({
    where: { published: true },
    include: {
      category: true,
      categoryLinks: { include: { category: true } },
      images: { orderBy: { order: 'asc' } },
      createdBy: { select: { id: true, name: true, avatar: true, whatsapp: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Primary category + any additional ones, deduped — exposed as `categories` for multi-category filtering
  const products = rawProducts.map(({ categoryLinks, ...p }) => {
    const extra = categoryLinks.map(l => l.category);
    const seen = new Set<string>();
    const categories = [p.category, ...extra].filter(c => {
      if (!c || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    return { ...p, categories };
  });

  const categories = await prisma.productCategory.findMany({
    orderBy: { name: 'asc' },
  });

  // Get wishlist counts per product
  const wishlistCounts = await prisma.wishlist.groupBy({
    by: ['productId'],
    _count: { id: true },
  });
  const countMap: Record<string, number> = {};
  wishlistCounts.forEach(wc => { countMap[wc.productId] = wc._count.id; });

  // Top wishlisted products for the 'Mais curtidos' category
  const topIds = wishlistCounts
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 20)
    .map(wc => wc.productId);

  // Active campaign products with promo prices
  const now = new Date();
  const activeCampaigns = await prisma.campaign.findMany({
    where: {
      active: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    include: {
      products: {
        select: { productId: true, promoPrice: true, highlightColor: true, discountType: true, discountValue: true },
      },
    },
  });

  // Build map: productId → { promoPrice, highlightColor, campaignName, discountType, discountValue, bgColor, glowColor }
  const campaignProductMap: Record<string, any> = {};
  activeCampaigns.forEach((camp: any) => {
    camp.products.forEach((cp: any) => {
      campaignProductMap[cp.productId] = {
        promoPrice: cp.promoPrice,
        highlightColor: cp.highlightColor,
        productDiscountType: cp.discountType,
        productDiscountValue: cp.discountValue,
        campaignName: camp.name,
        campaignColor: camp.themeColor,
        campaignBg: camp.bgColor,
        campaignGlow: camp.glowColor,
        discountType: camp.discountType,
        discountValue: camp.discountValue,
      };
    });
  });

  return {
    props: {
      products: JSON.parse(JSON.stringify(products)),
      categories: JSON.parse(JSON.stringify(categories)),
      totalProducts: products.length,
      productsPerPage: PRODUCTS_PER_PAGE,
      wishlistCounts: countMap,
      topWishlistedIds: topIds,
      campaignProducts: campaignProductMap,
    },
    revalidate: 60, // ISR: revalidate every 60 seconds
  };
};

type ViewMode = 'list' | 'grid';

const Catalogo: React.FC<InferGetStaticPropsType<typeof getStaticProps>> = ({
  products,
  categories,
  totalProducts,
  productsPerPage,
  wishlistCounts = {},
  topWishlistedIds = [],
  campaignProducts = {},
}) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const currentPage = Number(router.query.page) || 1;
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  const [selectedCategory, setSelectedCategory] = useState(() => (router.query.category as string) || '');
  const [sortBy, setSortBy] = useState(() => (router.query.sort as string) || '');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showGithub, setShowGithub] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('catalogViewMode') as ViewMode) || 'list';
    }
    return 'list';
  });

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('catalogViewMode', mode);
  };

  // Sync category from URL query param (for sidebar navigation from slug page)
  useEffect(() => {
    if (router.query.category) {
      setSelectedCategory(router.query.category as string);
    }
    if (router.query.sort) {
      setSortBy(router.query.sort as string);
    }
  }, [router.query.category, router.query.sort]);

  // Apply seasonal theme
  useEffect(() => {
    const theme = getCurrentSeasonalTheme();
    applySeasonalTheme(theme);
    return () => applySeasonalTheme(null);
  }, []);

  const { addItem, itemCount } = useCart();
  const { isWishlisted, toggleWishlist, wishlistIds } = useWishlist();
  const [cartOpen, setCartOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);

  // Load favorites for sidebar
  useEffect(() => {
    if (wishlistIds.size === 0) { setFavorites([]); return; }
    const favProducts = products.filter((p: any) => wishlistIds.has(p.id));
    setFavorites(favProducts.map((p: any) => ({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.images?.[0]?.image || null,
    })));
  }, [wishlistIds, products]);

  // Only show categories that currently have a product in the catalog (a product's primary OR any additional category counts)
  const sidebarCategories = useMemo(() => {
    const idsWithProducts = new Set<string>();
    products.forEach((p: any) => (p.categories || [p.category]).forEach((c: any) => c?.id && idsWithProducts.add(c.id)));
    return categories.filter((c: any) => idsWithProducts.has(c.id));
  }, [categories, products]);

  // Client-side filtering (category, sort, search)
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter — matches a product's primary category or any additional one it's linked to
    if (selectedCategory === '__top_wishlisted') {
      // Filter to only top wishlisted products, ordered by wishlist count
      result = topWishlistedIds
        .map((id: string) => products.find((p: any) => p.id === id))
        .filter(Boolean) as any[];
    } else if (selectedCategory) {
      result = result.filter(p => (p.categories || [p.category]).some((c: any) => c?.id === selectedCategory));
    }

    // Search filter
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.categories || [p.category]).some((c: any) => c?.name?.toLowerCase().includes(term))
      );
    }

    // Sort
    switch (sortBy) {
      case 'price_asc': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_desc': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: break; // already sorted by createdAt desc from getStaticProps
    }

    return result;
  }, [products, selectedCategory, sortBy, search]);

  // Pagination (applied after filtering)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  const totalFilteredPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Group for grid view
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    paginatedProducts.forEach(p => {
      const catName = p.category?.name || 'Sem categoria';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(p);
    });
    return groups;
  }, [paginatedProducts]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const handleWhatsApp = (product: Product) => {
    const message = buildProductInquiryMessage({
      name: product.name,
      priceLabel: product.priceNegotiable ? '_a negociar_' : `*${formatPrice(product.price || 0)}*`,
      link: typeof window !== 'undefined' ? `${window.location.origin}/catalogo/${product.slug}` : undefined,
    });
    const creatorWhatsapp = product.createdBy?.whatsapp || product.createdBy?.phone || '';
    openWhatsApp(message, creatorWhatsapp || undefined);
  };

  const buildPageUrl = (page: number) => {
    return `/catalogo?page=${page}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Catálogo - Xananas&apos; Garden</title>
        <meta name="description" content="Conheça nossas rosas do deserto, vasos e acessórios para jardinagem. Entrega na região de São Gonçalo do Amarante, RN." />
        <meta property="og:title" content="Catálogo - Xananas' Garden" />
        <meta property="og:description" content="Conheça nossas rosas do deserto, vasos e acessórios para jardinagem." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Store',
          name: "Xananas' Garden",
          description: 'Rosas do deserto, vasos e acessórios para jardinagem',
          address: { '@type': 'PostalAddress', streetAddress: 'Rua Bacharel Raimundo Mendes, 685', addressLocality: 'São Gonçalo do Amarante', addressRegion: 'RN', postalCode: '59000-000', addressCountry: 'BR' },
          geo: { '@type': 'GeoCoordinates', latitude: -5.775133, longitude: -35.277507 },
          url: 'https://xananasgarden.vercel.app/catalogo',
          makesOffer: products.slice(0, 20).map((p: any) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Product', name: p.name, description: p.description, image: p.images?.[0]?.image },
            price: p.price, priceCurrency: 'BRL',
          })),
        }) }} />
      </Head>

      <Header
        onSearch={setSearch}
        onToggleFilters={() => setFiltersOpen(prev => !prev)}
        filtersOpen={filtersOpen}
        onCartClick={() => setCartOpen(true)}
        products={products}
      />

      {/* Campaign Hero */}
      <div className="mx-4 md:mx-10 lg:mx-20 mt-4">
        <CampaignHero />
      </div>
      <div className="flex">
        <Sidebar
          categories={sidebarCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          favorites={favorites}
          topWishlistedCount={topWishlistedIds.length}
        />

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-5xl mx-auto">
          {/* Header bar */}
          <div className="flex items-center justify-between mx-4 md:mx-10 lg:mx-20 mt-6 mb-0">
            <div>
              <h1 className="font-bold text-xl text-gray-800">Produtos</h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* View toggle */}
            {filteredProducts.length > 0 && (                    <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5 backdrop-blur-sm">
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
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Nenhum produto encontrado</p>
                <p className="text-sm">Tente mudar a categoria ou filtro de ordenação.</p>
              </div>
            ) : viewMode === 'list' ? (
              /* ===== LIST VIEW ===== */
              <div className="flex flex-col gap-4 md:gap-6">
                {paginatedProducts.map(product => {
                  const cpInfo = campaignProducts[product.id];
                  const listCardLink = (
                  <Link
                    href={`/catalogo/${product.slug}`}
                    className={`border border-gray-200 rounded-xl overflow-hidden hover:border-[#de818d]/30 hover:shadow-md transition-all bg-white cursor-pointer block ${cpInfo ? 'relative z-[1]' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative w-full sm:w-44 md:w-48 h-44 sm:h-48 bg-gray-100 flex-shrink-0">
                        <ProductImagePager images={product.images} alt={product.name} sizes="(max-width: 640px) 100vw, 192px" />
                      </div>
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
                          <p className="text-gray-600 text-sm mt-2 line-clamp-2 sm:line-clamp-3" dangerouslySetInnerHTML={{ __html: product.description }} />
                          {product.note && (
                            <p className="text-xs text-gray-400 mt-1 italic">{product.note}</p>
                          )}
                          {product.createdBy && (
                            <div className="flex items-center gap-2 mt-2">
                              {product.createdBy.avatar ? (
                                <img src={product.createdBy.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-[#de818d]/10 flex items-center justify-center">
                                  <span className="text-[8px] text-[#de818d] font-bold">{product.createdBy.name?.charAt(0)?.toUpperCase()}</span>
                                </div>
                              )}
                              <span className="text-[10px] text-gray-400">Publicado por {product.createdBy.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            {product.priceNegotiable ? (
                              <h2 className="font-bold text-lg md:text-xl text-[#de818d]">A negociar</h2>
                            ) : (() => {
                              const dp = getCampaignDisplayPrice(product.price || 0, cpInfo ? {
                                promoPrice: cpInfo.promoPrice,
                                discountType: cpInfo.productDiscountType,
                                discountValue: cpInfo.productDiscountValue,
                                campaignDiscountType: cpInfo.discountType,
                                campaignDiscountValue: cpInfo.discountValue,
                              } : null);
                              return (
                                <>
                                  {dp.isPromo && (
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-xs text-gray-400 line-through">{formatPrice(dp.original)}</span>
                                      <span className="text-[10px] font-bold text-white bg-[#de818d] px-1.5 py-0.5 rounded-full">
                                        -{dp.discountLabel}
                                      </span>
                                    </div>
                                  )}
                                  <h2 className={`font-bold text-lg md:text-xl ${dp.isPromo ? 'text-red-500' : 'text-[#de818d]'}`}>
                                    {formatPrice(dp.price)}
                                  </h2>
                                  <p className="text-xs text-green-600">à vista ou em até 12x</p>
                                </>
                              );
                            })()}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleWishlist(product.id); }}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              title={isWishlisted(product.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                            >
                              <Heart size={16} className={isWishlisted(product.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
                              {(wishlistCounts[product.id] || 0) > 0 && (
                                <span className="text-[10px] font-medium text-gray-500">{wishlistCounts[product.id]}</span>
                              )}
                            </button>
                            {isAuthenticated && user?.admin && (
                              <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setEditingProduct(product); }}
                                className="flex items-center justify-center w-9 h-9 rounded-lg btn-glass-pink text-sm"
                                title="Editar produto">
                                <PencilSimple size={16} />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleWhatsApp(product); }}
                              className="flex items-center gap-1.5 btn-glass-green-solid text-sm font-medium py-2 px-3 md:px-4 rounded-lg"
                              title="Solicitar no WhatsApp"
                            >
                              <ChatCircleDots size={16} />
                              Solicitar no WhatsApp
                            </button>
                            {product.amount > 0 && !product.priceNegotiable && (
                              <button
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); addItem({ productId: product.id, name: product.name, price: product.price || 0, image: product.images?.[0]?.image }); }}
                                className="flex items-center justify-center bg-[#de818d] text-white w-9 h-9 rounded-lg hover:bg-[#c96a76] transition-colors"
                                title="Adicionar ao carrinho"
                              >
                                <ShoppingCart size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                  return cpInfo ? (
                    <CampaignGlowFrame key={product.id} glowColor={cpInfo.highlightColor || cpInfo.campaignGlow || cpInfo.campaignColor} className="rounded-xl">
                      {listCardLink}
                    </CampaignGlowFrame>
                  ) : (
                    <div key={product.id}>{listCardLink}</div>
                  );
                })}
              </div>
            ) : (
              /* ===== GRID VIEW ===== */
              <div className="space-y-8">
                {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
                  <div key={categoryName}>
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="font-bold text-base md:text-lg text-gray-800">{categoryName}</h2>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {categoryProducts.length}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryProducts.map(product => (
                        <GridCard key={product.id} product={product} formatPrice={formatPrice} onWhatsApp={handleWhatsApp} onAddToCart={(p) => addItem({ productId: p.id, name: p.name, price: p.price || 0, image: p.images?.[0]?.image })} isAdmin={isAuthenticated && !!user?.admin} isWishlisted={isWishlisted(product.id)} onToggleWishlist={toggleWishlist} wishlistCount={wishlistCounts[product.id] || 0} campaignInfo={campaignProducts[product.id]} />
                      ))}
                    </div>
                    <div className="flex md:hidden gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory">
                      {categoryProducts.map(product => (
                        <div key={product.id} className="flex-shrink-0 w-64 snap-start">
                          <GridCard product={product} formatPrice={formatPrice} onWhatsApp={handleWhatsApp} onAddToCart={(p) => addItem({ productId: p.id, name: p.name, price: p.price || 0, image: p.images?.[0]?.image })} isAdmin={isAuthenticated && !!user?.admin} isWishlisted={isWishlisted(product.id)} onToggleWishlist={toggleWishlist} wishlistCount={wishlistCounts[product.id] || 0} campaignInfo={campaignProducts[product.id]} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== PAGINATION ===== */}
            {totalFilteredPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-10">
                {/* Prev */}
                {currentPage > 1 ? (
                  <Link
                    href={buildPageUrl(currentPage - 1)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <CaretLeft size={16} />
                  </Link>
                ) : (
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-100 text-gray-300">
                    <CaretLeft size={16} />
                  </span>
                )}

                {/* Page numbers */}
                {Array.from({ length: totalFilteredPages }, (_, i) => i + 1).map(page => {
                  const isCurrent = page === currentPage;
                  const isNear = Math.abs(page - currentPage) <= 1;
                  const isEdge = page === 1 || page === totalFilteredPages;

                  if (!isNear && !isEdge) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-gray-300 px-1">...</span>;
                    }
                    return null;
                  }

                  return (
                    <Link
                      key={page}
                      href={buildPageUrl(page)}
                      className={`flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'btn-glass-pink-solid'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      {page}
                    </Link>
                  );
                })}

                {/* Next */}
                {currentPage < totalFilteredPages ? (
                  <Link
                    href={buildPageUrl(currentPage + 1)}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <CaretRight size={16} />
                  </Link>
                ) : (
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-100 text-gray-300">
                    <CaretRight size={16} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ChatBot />
      <CampaignModal />
      <InlineProductEdit product={editingProduct} onClose={() => setEditingProduct(null)} onSaved={() => window.location.reload()} categories={categories} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-10 lg:px-20 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="font-gloria text-[#de818d] text-lg">Xananas&apos; Garden</p>
              <p className="text-xs text-gray-500 mt-1">
                Rua Bacharel Raimundo Mendes, 685<br />
                Novo Amarante — São Gonçalo do Amarante, RN
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Todos os direitos reservados
              </p>
              <button
                onClick={() => setShowGithub(true)}
                className="text-xs text-gray-400 hover:text-[#de818d] transition-colors cursor-pointer mt-1"
              >
                made by <span className="font-mono font-medium">l1nds0n</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      <GitHubModal isOpen={showGithub} onClose={() => setShowGithub(false)} />
    </div>
  );
};

/* ===== Grid Card Component ===== */
interface CampaignInfo {
  promoPrice?: number | null;
  highlightColor?: string | null;
  productDiscountType?: string | null;
  productDiscountValue?: number | null;
  campaignName?: string;
  campaignColor?: string;
  campaignBg?: string;
  campaignGlow?: string | null;
  discountType?: string;
  discountValue?: number;
}

interface GridCardProps {
  product: Product;
  formatPrice: (price: number) => string;
  onWhatsApp: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  isAdmin?: boolean;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  wishlistCount?: number;
  campaignInfo?: CampaignInfo;
}

const GridCard: React.FC<GridCardProps> = ({ product, formatPrice, onWhatsApp, onAddToCart, onEdit, isAdmin, isWishlisted, onToggleWishlist, wishlistCount = 0, campaignInfo }) => {
  const { price: displayPrice, original: originalPrice, isPromo, discountLabel } = getCampaignDisplayPrice(product.price || 0, campaignInfo ? {
    promoPrice: campaignInfo.promoPrice,
    discountType: campaignInfo.productDiscountType,
    discountValue: campaignInfo.productDiscountValue,
    campaignDiscountType: campaignInfo.discountType,
    campaignDiscountValue: campaignInfo.discountValue,
  } : null);
  const cardLink = (
    <Link href={`/catalogo/${product.slug}`}
      className={`border border-gray-200 rounded-xl overflow-hidden hover:border-[#de818d]/30 hover:shadow-md transition-all bg-white flex flex-col h-full cursor-pointer block ${campaignInfo ? 'relative z-[1]' : ''}`}>
      <div className="relative w-full aspect-square bg-gray-100">
        <ProductImagePager images={product.images} alt={product.name} sizes="(max-width: 768px) 256px, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute top-2 right-2">
          {isPromo && (
            <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full mb-1 block" style={{ backgroundColor: campaignInfo?.campaignColor || '#de818d' }}>
              🔥 PROMO
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            product.amount > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-600'
          }`}>
            {product.amount > 0 ? `${product.amount} un.` : 'Esgotado'}
          </span>
        </div>
        {onToggleWishlist && (
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleWishlist(product.id); }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
              title={isWishlisted ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart size={16} className={isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400'} />
            </button>
            {wishlistCount > 0 && (
              <span className="flex items-center gap-0.5 bg-white/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm">
                <Heart size={8} className="text-red-400 fill-red-400" />
                {wishlistCount}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight">{product.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2 flex-1" dangerouslySetInnerHTML={{ __html: product.description }} />
        {product.createdBy && (
          <div className="flex items-center gap-1.5 mt-2">
            {product.createdBy.avatar ? (
              <img src={product.createdBy.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[#de818d]/10 flex items-center justify-center">
                <span className="text-[7px] text-[#de818d] font-bold">{product.createdBy.name?.charAt(0)?.toUpperCase()}</span>
              </div>
            )}
            <span className="text-[10px] text-gray-400">{product.createdBy.name}</span>
          </div>
        )}
        <div className="mt-3">
          {product.priceNegotiable ? (
            <p className="font-bold text-base text-[#de818d]">A negociar</p>
          ) : (
            <>
              {isPromo && (
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                  <span className="text-[10px] font-bold text-white bg-[#de818d] px-1.5 py-0.5 rounded-full">
                    -{discountLabel}
                  </span>
                </div>
              )}
              <p className={`font-bold text-base ${isPromo ? 'text-red-500' : 'text-[#de818d]'}`}>{formatPrice(displayPrice)}</p>
              <p className="text-[10px] text-green-600">à vista ou em até 12x</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          {isAdmin && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(product); }}
              className="flex items-center justify-center w-8 h-8 rounded-lg btn-glass-pink"
              title="Editar produto">
              <PencilSimple size={14} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onWhatsApp(product); }}
            className="flex-1 flex items-center justify-center gap-1 btn-glass-green-solid text-white text-xs font-medium py-2 rounded-lg"
            title="Solicitar no WhatsApp"
          >
            <ChatCircleDots size={14} />
            Solicitar no WhatsApp
          </button>
          {onAddToCart && product.amount > 0 && !product.priceNegotiable && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onAddToCart(product); }}
              className="flex items-center justify-center bg-[#de818d] text-white w-9 h-9 rounded-lg hover:bg-[#c96a76] transition-colors"
              title="Adicionar ao carrinho"
            >
              <ShoppingCart size={14} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );

  if (!campaignInfo) return cardLink;
  return (
    <CampaignGlowFrame glowColor={campaignInfo.highlightColor || campaignInfo.campaignGlow || campaignInfo.campaignColor} className="rounded-xl h-full">
      {cardLink}
    </CampaignGlowFrame>
  );
};

export default Catalogo;
