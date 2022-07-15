import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { CaretLeft, CaretRight, ShoppingCart, Tag } from 'phosphor-react';
import { getCampaignDisplayPrice } from '../../lib/campaignPricing';
import { CampaignModalProductLike } from '../../types/campaign';

interface ProductCarouselProps {
  products: CampaignModalProductLike[];
  accentColor: string;
  campaignDiscountType: string;
  campaignDiscountValue: number;
  onAddToCart?: (product: CampaignModalProductLike['product']) => void;
  autoPlay?: boolean;
  /** Dark theme (white text) — used inside the campaign modal over a photo/overlay */
  dark?: boolean;
  /** Smaller image/padding/type scale and no thumbnail filmstrip — for tight spaces like the embedded Hero */
  compact?: boolean;
  /** Bigger image/type scale on desktop — for a roomy container like the campaign modal */
  large?: boolean;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products, accentColor, campaignDiscountType, campaignDiscountValue, onAddToCart, autoPlay = true, dark = true,
  compact = false, large = false,
}) => {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToProduct = (slug?: string) => {
    if (slug) router.push(`/catalogo/${slug}`);
  };

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % products.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + products.length) % products.length);

  useEffect(() => {
    if (!autoPlay || products.length <= 1) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, products.length]);

  if (products.length === 0) return null;

  const textClass = dark ? 'text-white' : 'text-gray-800';
  const subTextClass = dark ? 'text-white/60' : 'text-gray-500';
  const cardClass = dark ? 'bg-white/10 backdrop-blur-md' : 'bg-white shadow-sm border border-gray-100';

  const handleAddToCart = (e: React.MouseEvent, product: CampaignModalProductLike['product']) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  if (products.length === 1) {
    const cp = products[0];
    const dp = getCampaignDisplayPrice(cp.product.price || 0, {
      promoPrice: cp.promoPrice, discountType: cp.discountType, discountValue: cp.discountValue,
      campaignDiscountType, campaignDiscountValue,
    });
    return (
      <div className="h-full flex items-center justify-center">
        <div onClick={() => goToProduct(cp.product.slug)}
          className={`flex items-center ${compact ? 'flex-row gap-4 rounded-xl p-3' : `flex-col md:flex-row rounded-2xl ${large ? 'gap-8 md:gap-12 p-6 md:p-8' : 'gap-8 p-6'}`} max-w-2xl ${cardClass} ${cp.product.slug ? 'cursor-pointer' : ''}`}>
          {cp.product.images?.[0]?.image && (
            <div className={`relative rounded-xl overflow-hidden flex-shrink-0 ${compact ? 'w-20 h-20' : large ? 'w-48 h-48 md:w-72 md:h-72' : 'w-48 h-48'}`}>
              <img src={cp.product.images[0].image} alt={cp.product.name} className="w-full h-full object-cover" />
              {dp.isPromo && (
                <span className={`absolute top-1 left-1 font-bold text-white px-1.5 py-0.5 rounded-full ${compact ? 'text-[8px]' : 'text-[10px] top-2 left-2'}`} style={{ backgroundColor: cp.highlightColor || accentColor }}>PROMO</span>
              )}
            </div>
          )}
          <div className={`${compact ? 'text-left flex-1 min-w-0' : 'text-center md:text-left'} ${textClass}`}>
            <h3 className={`font-bold ${compact ? 'text-sm truncate' : large ? 'text-xl md:text-3xl mb-1' : 'text-xl mb-1'}`}>{cp.product.name}</h3>
            {!compact && cp.product.category && <p className={`${large ? 'text-sm md:text-base' : 'text-sm'} mb-3 ${subTextClass}`}>{cp.product.category.name}</p>}
            {dp.isPromo && <p className={`line-through ${compact ? 'text-xs' : large ? 'text-sm md:text-lg mb-0.5' : 'text-sm mb-0.5'} ${subTextClass}`}>R$ {dp.original.toFixed(2)}</p>}
            <p className={`font-bold ${compact ? 'text-lg mb-1.5' : large ? 'text-3xl md:text-5xl mb-4' : 'text-3xl mb-4'}`} style={{ color: cp.highlightColor || accentColor }}>R$ {dp.price.toFixed(2)}</p>
            <button onClick={(e) => handleAddToCart(e, cp.product)}
              className={`flex items-center gap-2 hover:opacity-90 transition-opacity text-white font-medium rounded-xl ${compact ? 'px-3 py-1.5 text-xs' : large ? 'mx-auto md:mx-0 px-6 md:px-8 py-2.5 md:py-3.5 text-sm md:text-base' : 'mx-auto md:mx-0 px-6 py-2.5 text-sm'}`}
              style={{ backgroundColor: cp.highlightColor || accentColor }}>
              <ShoppingCart size={compact ? 13 : large ? 18 : 16} /> Adicionar ao Carrinho
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center relative min-h-0">
        <button onClick={prevSlide}
          className={`absolute left-0 z-20 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${compact ? 'w-8 h-8' : large ? 'w-10 h-10 md:w-12 md:h-12' : 'w-10 h-10'} ${dark ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
          <CaretLeft size={compact ? 16 : large ? 22 : 20} />
        </button>

        {(() => {
          const cp = products[currentSlide];
          if (!cp) return null;
          const dp = getCampaignDisplayPrice(cp.product.price || 0, {
            promoPrice: cp.promoPrice, discountType: cp.discountType, discountValue: cp.discountValue,
            campaignDiscountType, campaignDiscountValue,
          });
          return (
            <div onClick={() => goToProduct(cp.product.slug)}
              className={`flex items-center transition-all ${compact ? 'flex-row gap-4 rounded-xl p-3 mx-11' : `flex-col md:flex-row rounded-2xl max-w-2xl w-full ${large ? 'gap-6 md:gap-10 p-6 md:p-8 mx-16' : 'gap-6 p-6 mx-14'}`} ${!compact ? 'max-w-2xl w-full' : ''} ${cardClass} ${cp.product.slug ? 'cursor-pointer' : ''}`}>
              <div className={`relative rounded-xl overflow-hidden flex-shrink-0 ${compact ? 'w-20 h-20' : large ? 'w-40 h-40 md:w-64 md:h-64' : 'w-40 h-40 md:w-52 md:h-52'}`}>
                {cp.product.images?.[0]?.image ? (
                  <img src={cp.product.images[0].image} alt={cp.product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-xs ${dark ? 'bg-white/20 text-white/50' : 'bg-gray-100 text-gray-300'}`}>{compact ? '' : 'Sem imagem'}</div>
                )}
                {dp.isPromo && (
                  <span className={`absolute font-bold text-white rounded-full ${compact ? 'top-1 left-1 text-[8px] px-1.5 py-0.5' : 'top-2 left-2 text-[10px] px-2 py-0.5'}`} style={{ backgroundColor: cp.highlightColor || accentColor }}>PROMO</span>
                )}
              </div>
              <div className={`flex-1 min-w-0 ${compact ? 'text-left' : 'text-center md:text-left'} ${textClass}`}>
                <h3 className={`font-bold ${compact ? 'text-sm truncate' : large ? 'text-lg md:text-3xl mb-1' : 'text-lg md:text-2xl mb-1'}`}>{cp.product.name}</h3>
                {!compact && cp.product.category && <p className={`${large ? 'text-xs md:text-sm' : 'text-xs'} mb-2 ${subTextClass}`}>{cp.product.category.name}</p>}
                {dp.isPromo && (
                  <div className={`flex items-center gap-1.5 ${compact ? '' : 'justify-center md:justify-start mb-1'}`}>
                    {!compact && <Tag size={large ? 14 : 12} className={subTextClass} />}
                    <p className={`line-through ${compact ? 'text-xs' : large ? 'text-sm md:text-lg' : 'text-sm'} ${subTextClass}`}>R$ {dp.original.toFixed(2)}</p>
                  </div>
                )}
                <p className={`font-bold ${compact ? 'text-lg mb-1.5' : large ? 'text-2xl md:text-4xl mb-4' : 'text-2xl md:text-3xl mb-4'}`} style={{ color: accentColor }}>R$ {dp.price.toFixed(2)}</p>
                <button onClick={(e) => handleAddToCart(e, cp.product)}
                  className={`flex items-center gap-2 hover:opacity-90 transition-opacity text-white font-medium rounded-xl ${compact ? 'px-3 py-1.5 text-xs' : large ? 'mx-auto md:mx-0 px-5 md:px-7 py-2 md:py-3 text-sm md:text-base' : 'mx-auto md:mx-0 px-5 py-2 text-sm'}`}
                  style={{ backgroundColor: cp.highlightColor || accentColor }}>
                  <ShoppingCart size={compact ? 13 : large ? 16 : 14} /> Adicionar ao Carrinho
                </button>
              </div>
            </div>
          );
        })()}

        <button onClick={nextSlide}
          className={`absolute right-0 z-20 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${compact ? 'w-8 h-8' : large ? 'w-10 h-10 md:w-12 md:h-12' : 'w-10 h-10'} ${dark ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
          <CaretRight size={compact ? 16 : large ? 22 : 20} />
        </button>
      </div>

      {!compact && (
        <div className="flex items-center justify-center gap-2 mt-3 pb-2 overflow-x-auto">
          {products.map((cp, i) => (
            <button key={cp.id} onClick={() => setCurrentSlide(i)}
              className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${large ? 'w-12 h-12 md:w-16 md:h-16' : 'w-12 h-12'} ${i === currentSlide ? (dark ? 'border-white scale-110' : 'border-gray-800 scale-110') : (dark ? 'border-white/30 opacity-60 hover:opacity-80' : 'border-gray-200 opacity-60 hover:opacity-80')}`}>
              {cp.product.images?.[0]?.image ? (
                <img src={cp.product.images[0].image} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full ${dark ? 'bg-white/20' : 'bg-gray-100'}`} />
              )}
            </button>
          ))}
        </div>
      )}

      <div className={`flex items-center justify-center gap-1.5 ${compact ? 'pb-1 pt-1.5' : 'pb-2'}`}>
        {products.map((_, i) => (
          <button key={i} onClick={() => setCurrentSlide(i)}
            className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-6' : `w-1.5 ${dark ? 'bg-white/40' : 'bg-gray-300'}`}`}
            style={i === currentSlide ? { backgroundColor: accentColor } : {}} />
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
