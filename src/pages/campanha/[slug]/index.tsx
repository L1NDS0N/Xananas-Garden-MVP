import React, { useState, useMemo } from 'react';
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, ChatCircleDots, ShoppingCart } from 'phosphor-react';
import Header from '../../../components/Header';
import CartDrawer from '../../../components/CartDrawer';
import ProductCarousel from '../../../components/ProductCarousel';
import SearchInput from '../../../components/SearchInput';
import { useCart } from '../../../context/CartContext';
import { prisma } from '../../../lib/prisma';
import { extractYouTubeId } from '../../../lib/slugify';
import { getCampaignDisplayPrice } from '../../../lib/campaignPricing';
import CampaignGlowFrame from '../../../components/CampaignGlowFrame';
import { openWhatsApp } from '../../../lib/settings';

export const getStaticPaths: GetStaticPaths = async () => {
  const campaigns = await prisma.campaign.findMany({ where: { active: true, slug: { not: null } }, select: { slug: true } });
  return {
    paths: campaigns.filter(c => c.slug).map(c => ({ params: { slug: c.slug as string } })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const now = new Date();
  const campaign = await prisma.campaign.findFirst({
    where: {
      slug,
      active: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { orderBy: { order: 'asc' } },
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!campaign) return { notFound: true, revalidate: 60 };

  return { props: { campaign: JSON.parse(JSON.stringify(campaign)) }, revalidate: 60 };
};

const CampanhaPage: React.FC<InferGetStaticPropsType<typeof getStaticProps>> = ({ campaign }) => {
  const { addItem } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState('');

  const color = campaign.themeColor || '#de818d';
  const bg = campaign.bgColor || '#fff0f3';
  const text = campaign.textColor || '#ffffff';
  const glow = campaign.glowColor || color;
  const ytId = campaign.heroVideo ? extractYouTubeId(campaign.heroVideo) : null;
  const hasMedia = !!(campaign.heroImage || ytId);

  const formatPrice = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleAddToCart = (product: any) => {
    addItem({ productId: product.id, name: product.name, price: product.price || 0, image: product.images?.[0]?.image });
  };

  const handleWhatsApp = (product: any) => {
    const message = `Olá! Tenho interesse no produto: *${product.name}*\nPreço: ${formatPrice(product.price || 0)}\n\nVi na campanha "${campaign.name}"!`;
    openWhatsApp(message);
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return campaign.products;
    const q = search.trim().toLowerCase();
    return campaign.products.filter((cp: any) =>
      cp.product.name.toLowerCase().includes(q) || cp.product.category?.name?.toLowerCase().includes(q));
  }, [campaign.products, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{campaign.name} - Xananas&apos; Garden</title>
        <meta name="description" content={campaign.heroSubtitle || campaign.description || campaign.name} />
      </Head>

      <Header onCartClick={() => setCartOpen(true)} />

      {/* Hero — compact, with the product carousel embedded */}
      <div className="relative w-full overflow-hidden animate-fadeIn" style={{ backgroundColor: bg, boxShadow: `0 10px 40px -16px ${glow}66` }}>
        {hasMedia && (
          <div className="absolute inset-0">
            {ytId ? (
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0`}
                className="absolute inset-0 w-full h-full object-cover"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <img src={campaign.heroImage} alt={campaign.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/75" />
          </div>
        )}
        <div className="relative max-w-5xl mx-auto px-4 md:px-10 lg:px-20 py-8 md:py-10 text-center">
          <Link href="/catalogo" className="inline-flex items-center gap-1.5 text-sm mb-3 hover:underline animate-fadeInUp" style={{ color: hasMedia ? text : color }}>
            <ArrowLeft size={16} /> Voltar ao catálogo
          </Link>
          <h1 className="text-2xl md:text-4xl font-bold mb-2 animate-fadeInUp" style={{ color: hasMedia ? text : color }}>
            {campaign.heroTitle || campaign.name}
          </h1>
          {campaign.heroSubtitle && (
            <p className="text-sm md:text-lg mb-3 animate-fadeInUp" style={{ color: hasMedia ? text : '#6b7280', opacity: hasMedia ? 0.9 : 1 }}>
              {campaign.heroSubtitle}
            </p>
          )}
          <div className="inline-block px-5 py-1.5 rounded-full text-white font-bold text-base shadow-lg animate-fadeInUp" style={{ backgroundColor: color }}>
            {campaign.discountType === 'percentage' ? `${campaign.discountValue}% OFF` : `${formatPrice(campaign.discountValue)} OFF`}
          </div>
          {campaign.description && (
            <div
              className="mt-4 max-w-2xl mx-auto text-sm"
              style={{ color: hasMedia ? text : '#4b5563', opacity: hasMedia ? 0.85 : 1 }}
              dangerouslySetInnerHTML={{ __html: campaign.description }}
            />
          )}
        </div>

        {campaign.products.length > 0 && (
          <div className="relative max-w-5xl mx-auto px-4 md:px-10 lg:px-20 pb-6">
            <div className={`h-[300px] md:h-[340px] rounded-2xl overflow-hidden p-2 md:p-3 ${hasMedia ? 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl' : ''}`}>
              <ProductCarousel
                products={campaign.products}
                accentColor={color}
                campaignDiscountType={campaign.discountType}
                campaignDiscountValue={campaign.discountValue}
                onAddToCart={handleAddToCart}
                dark={hasMedia}
              />
            </div>
          </div>
        )}
      </div>

      {/* Full product grid — only this campaign's products */}
      <div className="max-w-5xl mx-auto px-4 md:px-10 lg:px-20 py-10">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h2 className="font-bold text-xl text-gray-800">Todos os produtos da campanha</h2>
          {campaign.products.length > 4 && (
            <SearchInput value={search} onChange={setSearch} placeholder="Filtrar produtos..." className="max-w-xs" />
          )}
        </div>
        {campaign.products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Nenhum produto nesta campanha ainda.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={48} className="mx-auto mb-3 text-gray-300" />
            <p>Nenhum produto encontrado para &quot;{search}&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((cp: any, i: number) => {
              const dp = getCampaignDisplayPrice(cp.product.price || 0, {
                promoPrice: cp.promoPrice, discountType: cp.discountType, discountValue: cp.discountValue,
                campaignDiscountType: campaign.discountType, campaignDiscountValue: campaign.discountValue,
              });
              return (
                <CampaignGlowFrame key={cp.id} glowColor={cp.highlightColor || glow} className="rounded-xl">
                <Link href={`/catalogo/${cp.product.slug}`}
                  className="relative z-[1] rounded-xl overflow-hidden bg-white flex flex-col hover:shadow-md transition-shadow animate-fadeInUp"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                  <div className="relative w-full aspect-square bg-gray-100">
                    {cp.product.images?.[0] ? (
                      <Image src={cp.product.images[0].image} alt={cp.product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package size={32} className="text-gray-300" /></div>
                    )}
                    {dp.isPromo && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: color }}>🔥 PROMO</span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">{cp.product.name}</h3>
                    <div className="mt-2">
                      {dp.isPromo && <span className="text-xs text-gray-400 line-through mr-1.5">{formatPrice(dp.original)}</span>}
                      <span className="font-bold text-base" style={{ color: dp.isPromo ? color : '#374151' }}>{formatPrice(dp.price)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={(e) => { e.preventDefault(); handleWhatsApp(cp.product); }}
                        className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium py-2 rounded-lg transition-colors">
                        <ChatCircleDots size={14} /> WhatsApp
                      </button>
                      <button onClick={(e) => { e.preventDefault(); handleAddToCart(cp.product); }}
                        className="flex items-center justify-center text-white w-9 h-9 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
                        style={{ backgroundColor: color }}>
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </Link>
                </CampaignGlowFrame>
              );
            })}
          </div>
        )}
      </div>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default CampanhaPage;
