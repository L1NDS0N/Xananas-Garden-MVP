import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChatCircleDots, Package, ShareNetwork, CaretLeft, CaretRight, Play, ArrowRight, ShoppingCart, PencilSimple } from 'phosphor-react';
import InlineProductEdit from '../../../components/InlineProductEdit';
import CartDrawer from '../../../components/CartDrawer';
import { useCart } from '../../../context/CartContext';
import { extractYouTubeId } from '../../../lib/slugify';
import ChatBot from '../../../components/ChatBot';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import GalleryLightbox, { GalleryItem } from '../../../components/Gallery';
import { openWhatsApp } from '../../../lib/settings';
import { buildProductInquiryMessage } from '../../../lib/whatsappMessage';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/Toast';
import AnimatedLogo from '../../../components/AnimatedLogo';
import { useProductBySlug } from '../../../hooks/useSWRProducts';

interface ProductImage {
  id: string;
  image: string;

  order?: number;
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
  videoUrl?: string | null;
  videoPosition?: number;
  tags?: string | null;
  category: Category;
  categories?: Category[];
  images: ProductImage[];
  createdBy?: Creator | null;
  createdAt: string;
}

const ProductDetail: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { product, isLoading, isError } = useProductBySlug(slug as string | undefined);
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Fetch related products — ranked by shared hashtags first, then same category
  useEffect(() => {
    if (!product?.id) return;
    const productTags = (product.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const categoryId = product.category?.id;

    const load = async () => {
      try {
        const catRes = categoryId ? await fetch(`/api/v1/products?categoryId=${categoryId}`).then(r => r.json()) : [];
        let candidates: Product[] = Array.isArray(catRes) ? catRes.filter((p: Product) => p.id !== product.id) : [];

        // If the product has tags, also look across all categories for tag matches
        if (productTags.length > 0) {
          const allRes = await fetch('/api/v1/products').then(r => r.json());
          if (Array.isArray(allRes)) {
            const seen = new Set(candidates.map(c => c.id));
            allRes.forEach((p: Product) => {
              if (p.id !== product.id && !seen.has(p.id)) { candidates.push(p); seen.add(p.id); }
            });
          }
        }

        const scored = candidates.map(p => {
          const pTags = (p.tags || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
          const overlap = pTags.filter(t => productTags.includes(t)).length;
          const sameCategory = p.category?.id === categoryId ? 1 : 0;
          return { p, score: overlap * 10 + sameCategory };
        }).filter(s => s.score > 0);

        scored.sort((a, b) => b.score - a.score);
        setRelatedProducts(scored.slice(0, 4).map(s => s.p));
      } catch {}
    };
    load();
  }, [product?.id]);

  // Build unified gallery items: images + video, respecting order
  const buildGalleryItems = (): GalleryItem[] => {
    if (!product) return [];
    const items: GalleryItem[] = [];

    // Only include video if the product has a videoUrl
    const videoItem: GalleryItem | null = product.videoUrl ? (() => {
      const ytId = extractYouTubeId(product.videoUrl!);
      return {
        id: 'video-main',
        type: 'video' as const,
        src: product.videoUrl!,
        thumb: ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : undefined,
        alt: `${product.name} - Vídeo`,
      };
    })() : null;

    const videoPos = product.videoPosition ?? 99;

    if (product.images && product.images.length > 0) {
      const sorted = [...product.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      sorted.forEach((img, index) => {
        if (videoItem && index === videoPos) {
          items.push(videoItem);
        }
        items.push({
          id: img.id,
          type: 'image',
          src: img.image,
          thumb: img.image,
          alt: product.name,
        });
      });

      if (videoItem && videoPos >= sorted.length) {
        items.push(videoItem);
      }
    } else if (videoItem) {
      items.push(videoItem);
    }

    return items;
  };

  const galleryItems = buildGalleryItems();
  const hasVideo = !!product?.videoUrl;
  const totalSlides = galleryItems.length;
  const hasImages = product?.images && product.images.length > 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const message = buildProductInquiryMessage({
      name: product.name,
      priceLabel: product.priceNegotiable ? '_a negociar_' : `*${formatPrice(product.price || 0)}*`,
      link: window.location.href,
    });
    const creatorWhatsapp = product.createdBy?.whatsapp || product.createdBy?.phone || '';
    openWhatsApp(message, creatorWhatsapp || user?.phone);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Confira ${product?.name} na Xananas' Garden!`,
          url,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado!');
    }
  };

  const goNextSlide = () => setActiveSlide(prev => (prev + 1) % totalSlides);
  const goPrevSlide = () => setActiveSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };

  const activeItem = galleryItems[activeSlide];
  const isVideoSlide = activeItem?.type === 'video';
  const activeYoutubeId = isVideoSlide ? extractYouTubeId(activeItem.src) : null;

  if (isLoading || !router.isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <AnimatedLogo size={60} />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <Package size={48} className="text-gray-300" />
        <h1 className="text-xl font-semibold text-gray-600">Produto não encontrado</h1>
        <Link href="/catalogo" className="flex items-center gap-2 text-[#de818d] hover:underline">
          <ArrowLeft size={18} />
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{product.name} - Xananas&apos; Garden</title>
        <meta name="description" content={product.description.substring(0, 160)} />
        <meta property="og:title" content={`${product.name} - Xananas' Garden`} />
        <meta property="og:description" content={product.description.substring(0, 160)} />
        {product.images?.[0] && (
          <meta property="og:image" content={product.images[0].image} />
        )}
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={String(product.price || 0)} />
        <meta property="product:price:currency" content="BRL" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.description.replace(/<[^>]*>/g, ''),
          image: product.images?.map((img: any) => img.image),
          brand: { '@type': 'Brand', name: "Xananas' Garden" },
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'BRL',
            availability: product.amount > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: { '@type': 'Organization', name: "Xananas' Garden" },
          },
          category: product.category?.name,
        }) }} />
      </Head>

      <Header onToggleFilters={() => setFiltersOpen(prev => !prev)} filtersOpen={filtersOpen} onCartClick={() => setCartOpen(true)} />

      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} />

        <div className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-4 py-4 md:py-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link href="/catalogo" className="hover:text-[#de818d]">Catálogo</Link>
              <span>/</span>
              <span className="text-gray-600">{product.category?.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ===== CAROUSEL ===== */}
              <div className="space-y-3">
                <div
                  className="relative bg-white rounded-xl md:rounded-2xl overflow-hidden border border-gray-200 cursor-pointer group"
                  onClick={() => totalSlides > 0 && openLightbox(activeSlide)}
                >
                  <div className="aspect-square relative">
                    {totalSlides === 0 ? (
                      // No images and no video — show placeholder
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                        <Package size={80} className="text-gray-300 mb-3" />
                        <p className="text-sm text-gray-400">Sem mídia disponível</p>
                      </div>
                    ) : isVideoSlide && activeYoutubeId ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                        <img
                          src={activeItem.thumb || `https://img.youtube.com/vi/${activeYoutubeId}/hqdefault.jpg`}
                          alt={activeItem.alt || ''}
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                            <Play size={36} fill="white" className="text-white ml-1" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <Play size={10} fill="white" className="text-white" />
                          YouTube
                        </div>
                      </div>
                    ) : isVideoSlide ? (
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                        <img src={activeItem.thumb || ''} alt={activeItem.alt || ''} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                            <Play size={36} fill="white" className="text-white ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img src={activeItem.src} alt={activeItem.alt || product.name} className="w-full h-full object-cover" />
                    )}

                    {/* Navigation arrows */}
                    {totalSlides > 1 && (
                      <>
                        <button onClick={e => { e.stopPropagation(); goPrevSlide(); }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10">
                          <CaretLeft size={20} className="text-gray-700" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); goNextSlide(); }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-colors z-10">
                          <CaretRight size={20} className="text-gray-700" />
                        </button>
                      </>
                    )}

                    {totalSlides > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                        {activeSlide + 1} / {totalSlides}
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail strip */}
                {totalSlides > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {galleryItems.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSlide(index)}
                        className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          activeSlide === index
                            ? 'border-[#de818d] ring-1 ring-[#de818d]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {item.type === 'video' ? (
                          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                            {item.thumb ? (
                              <img src={item.thumb} alt="" className="w-full h-full object-cover opacity-70" />
                            ) : (
                              <Play size={14} fill="white" className="text-white" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Play size={12} fill="white" className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <img src={item.thumb || item.src} alt="" className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Media count */}
                {(hasImages || hasVideo) && (
                  <p className="text-xs text-gray-400 text-center">
                    📷 {product.images?.length || 0} foto{(product.images?.length || 0) !== 1 ? 's' : ''}
                    {hasVideo && ' · 🎬 1 vídeo'}
                  </p>
                )}
              </div>

              {/* ===== PRODUCT INFO ===== */}
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-[#de818d] font-medium mb-1">
                    {(product.categories?.length ? product.categories : [product.category]).filter(Boolean).map(c => c!.name).join(' · ')}
                  </p>
                  <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-100">
                  {product.priceNegotiable ? (
                    <p className="text-3xl font-bold text-[#de818d]">A negociar</p>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-[#de818d]">{formatPrice(product.price || 0)}</p>
                      <p className="text-sm text-green-600 mt-1">à vista ou em até 12x sem juros</p>
                    </>
                  )}
                </div>

                {/* Stock */}
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${product.amount > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${product.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.amount > 0 ? `${product.amount} unidades em estoque` : 'Indisponível'}
                  </span>
                </div>

                {/* Creator info */}
                {product.createdBy && (
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4">
                    {product.createdBy.avatar ? (
                      <img src={product.createdBy.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#de818d]/10 flex items-center justify-center">
                        <span className="text-sm text-[#de818d] font-bold">{product.createdBy.name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-800">Publicado por {product.createdBy.name}</p>
                      <p className="text-xs text-gray-400">Anunciante responsável por este produto</p>
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-semibold text-gray-800 mb-3">Descrição</h2>
                  <div
                    className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-800 prose-a:text-[#de818d] prose-strong:text-gray-700 prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>

                {product.note && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">📝 {product.note}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {!product.priceNegotiable && (
                    <button onClick={() => {
                      if (product && product.amount > 0) {
                        addItem({ productId: product.id, name: product.name, price: product.price || 0, image: product.images?.[0]?.image });
                        toast('Adicionado ao carrinho!', 'success');
                      }
                    }} disabled={!product || product.amount <= 0}
                      className="w-full flex items-center justify-center gap-3 bg-[#de818d] hover:bg-[#c96a76] text-white font-semibold py-4 px-6 rounded-xl text-lg disabled:opacity-50 transition-colors">
                      <ShoppingCart size={22} />
                      Adicionar ao Carrinho
                    </button>
                  )}
                  <button onClick={handleWhatsApp} className="w-full flex items-center justify-center gap-3 btn-glass-green-solid font-semibold py-4 px-6 rounded-xl text-lg">
                    <ChatCircleDots size={22} />
                    Solicitar no WhatsApp
                  </button>
                  <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 btn-glass-gray font-medium py-3 px-6 rounded-xl">
                    <ShareNetwork size={18} />
                    Compartilhar
                  </button>
                  {isAuthenticated && user?.admin && (
                    <button onClick={() => setEditingProduct(product)}
                      className="w-full flex items-center justify-center gap-2 btn-glass-pink font-medium py-3 px-6 rounded-xl">
                      <PencilSimple size={18} />
                      Editar Produto
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-semibold text-gray-800 mb-3">Detalhes do produto</h2>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <dt className="text-gray-500">Categoria</dt>
                    <dd className="text-gray-800 font-medium">{product.category?.name}</dd>
                    <dt className="text-gray-500">Disponibilidade</dt>
                    <dd className="text-gray-800 font-medium">{product.amount > 0 ? 'Em estoque' : 'Indisponível'}</dd>
                    <dt className="text-gray-500">Publicado em</dt>
                    <dd className="text-gray-800 font-medium">{new Date(product.createdAt).toLocaleDateString('pt-BR')}</dd>
                    {hasVideo && (
                      <>
                        <dt className="text-gray-500">Vídeo</dt>
                        <dd className="text-gray-800 font-medium">Disponível</dd>
                      </>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            {/* ===== RECOMMENDED PRODUCTS ===== */}
            {relatedProducts.length > 0 && (
              <div className="mt-12">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-bold text-lg text-gray-800">Produtos relacionados</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {product.category?.name}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map(rp => (
                    <Link key={rp.id} href={`/catalogo/${rp.slug}`} className="border border-gray-200 rounded-xl overflow-hidden hover:border-[#de818d]/30 transition-all bg-white flex flex-col">
                      <div className="relative w-full aspect-square bg-gray-100">
                        {rp.images && rp.images.length > 0 ? (
                          <Image
                            src={rp.images[0].image}
                            alt={rp.name}
                            fill
                            className="object-cover"
                            sizes="256px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={32} className="text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight">{rp.name}</h3>
                        <div className="mt-auto pt-2">
                          <p className="font-bold text-sm text-[#de818d]">{formatPrice(rp.price || 0)}</p>
                        </div>
                        <div className="flex items-center justify-center gap-1 btn-glass-pink-solid text-xs font-medium py-1.5 rounded-lg mt-2">
                          Ver detalhes
                          <ArrowRight size={12} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <GalleryLightbox
        items={galleryItems}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />

      <InlineProductEdit product={editingProduct} onClose={() => setEditingProduct(null)} onSaved={() => window.location.reload()} categories={[]} />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <ChatBot />
    </>
  );
};

export default ProductDetail;
