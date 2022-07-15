import React, { useState, useMemo } from 'react';
import { X, CaretLeft, CaretRight } from 'phosphor-react';
import ProductCarousel from '../ProductCarousel';
import SearchInput from '../SearchInput';
import { CampaignModalProductLike } from '../../types/campaign';

export type { CampaignModalProductLike };

export interface CampaignModalViewCampaign {
  name: string;
  description?: string | null;
  modalImage?: string | null;
  heroImage?: string | null;
  modalTitle?: string | null;
  modalSubtitle?: string | null;
  themeColor?: string | null;
  bgColor?: string | null;
  textColor?: string | null;
  discountType: string;
  discountValue: number;
  products: CampaignModalProductLike[];
}

interface CampaignModalViewProps {
  campaign: CampaignModalViewCampaign;
  onClose: () => void;
  onDontShowAgain: () => void;
  onGoToCampaign?: () => void;
  onAddToCart?: (product: CampaignModalProductLike['product']) => void;
  /** Disables the auto-advance timer — useful for a static admin preview */
  autoPlay?: boolean;
  /** Multi-campaign carousel — when there's more than one eligible campaign to show */
  totalCampaigns?: number;
  currentIndex?: number;
  onPrevCampaign?: () => void;
  onNextCampaign?: () => void;
}

const CampaignModalView: React.FC<CampaignModalViewProps> = ({
  campaign, onClose, onDontShowAgain, onGoToCampaign, onAddToCart, autoPlay = true,
  totalCampaigns = 1, currentIndex = 0, onPrevCampaign, onNextCampaign,
}) => {
  const [search, setSearch] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);
  const color = campaign.themeColor || '#de818d';
  const bg = campaign.bgColor || '#fff0f3';
  const text = campaign.textColor || '#ffffff';
  const hasProducts = campaign.products && campaign.products.length > 0;
  const showFilter = campaign.products && campaign.products.length > 4;
  const bgImage = campaign.heroImage || campaign.modalImage;
  const isMultiCampaign = totalCampaigns > 1;

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return campaign.products;
    const q = search.trim().toLowerCase();
    return campaign.products.filter(cp =>
      cp.product.name.toLowerCase().includes(q) || cp.product.category?.name.toLowerCase().includes(q));
  }, [campaign.products, search]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div key={campaign.name + currentIndex} className="relative bg-white rounded-3xl shadow-2xl w-[92vw] h-[88vh] max-w-6xl overflow-hidden flex flex-col animate-scaleIn">

        {bgImage && (
          <div className="absolute inset-0 z-0">
            <img src={bgImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60" />
          </div>
        )}

        {/* Multi-campaign navigation */}
        {isMultiCampaign && (
          <>
            <button onClick={onPrevCampaign} title="Campanha anterior"
              className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${bgImage ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              <CaretLeft size={18} />
            </button>
            <button onClick={onNextCampaign} title="Próxima campanha"
              className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${bgImage ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              <CaretRight size={18} />
            </button>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {Array.from({ length: totalCampaigns }).map((_, i) => (
                <span key={i} className="h-1.5 rounded-full transition-all"
                  style={{ width: i === currentIndex ? 20 : 6, backgroundColor: i === currentIndex ? color : (bgImage ? 'rgba(255,255,255,0.6)' : '#d1d5db') }} />
              ))}
            </div>
          </>
        )}

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0" style={bgImage ? {} : { backgroundColor: bg }}>
          <div className={`min-w-0 ${isMultiCampaign ? 'pl-8' : ''}`}>
            <h2 className="font-bold text-lg sm:text-xl drop-shadow-lg truncate" style={{ color: bgImage ? text : color }}>
              {campaign.modalTitle || campaign.name}
            </h2>
            {campaign.modalSubtitle && (
              <p className="text-xs sm:text-sm opacity-80 drop-shadow truncate" style={{ color: bgImage ? text : '#6b7280' }}>{campaign.modalSubtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="px-3 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm shadow-lg whitespace-nowrap" style={{ backgroundColor: color, color: text }}>
              {campaign.discountType === 'percentage' ? `${campaign.discountValue}% OFF` : `R$ ${campaign.discountValue} OFF`}
            </div>
            <button onClick={onClose} title="Fechar"
              className={`w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${bgImage ? 'bg-white/20 hover:bg-white/40 text-white' : 'bg-black/5 hover:bg-black/10'}`}
              style={bgImage ? {} : { color: color }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Description — collapsed to 2 lines by default; "Ver mais" expands it (and shrinks the carousel to make room) */}
        {campaign.description && (
          <div className="relative z-10 px-4 sm:px-6 pb-2 flex-shrink-0">
            <div className={`rounded-xl px-4 py-2 text-sm ${descExpanded ? 'max-h-28 sm:max-h-40 overflow-y-auto' : 'line-clamp-2'} ${bgImage ? 'bg-white/10 backdrop-blur-sm text-white/90' : 'bg-gray-50 text-gray-600'}`}
              dangerouslySetInnerHTML={{ __html: campaign.description }} />
            <button onClick={() => setDescExpanded(v => !v)}
              className="text-xs font-semibold mt-1 hover:underline"
              style={{ color: bgImage ? text : color }}>
              {descExpanded ? 'Ver menos' : 'Ver mais'}
            </button>
          </div>
        )}

        {/* Product filter */}
        {showFilter && (
          <div className="relative z-10 px-4 sm:px-6 pb-2 flex-shrink-0">
            <SearchInput value={search} onChange={setSearch} placeholder="Filtrar produtos da campanha..." className="max-w-xs" />
          </div>
        )}

        {/* Product Carousel */}
        {hasProducts && (
          <div className="relative z-10 flex-1 min-h-0 px-3 sm:px-6 py-3 sm:py-4">
            {filteredProducts.length > 0 ? (
              <ProductCarousel
                products={filteredProducts}
                accentColor={color}
                campaignDiscountType={campaign.discountType}
                campaignDiscountValue={campaign.discountValue}
                onAddToCart={onAddToCart}
                autoPlay={autoPlay}
                dark={!!bgImage}
                compact={descExpanded}
                large={!descExpanded}
              />
            ) : (
              <div className={`h-full flex items-center justify-center text-sm ${bgImage ? 'text-white/70' : 'text-gray-400'}`}>Nenhum produto encontrado</div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0" style={bgImage ? {} : { backgroundColor: bg }}>
          {onGoToCampaign && (
            <button onClick={onGoToCampaign}
              className="w-full sm:w-auto order-1 sm:order-2 px-8 py-2.5 sm:py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg"
              style={{ backgroundColor: color }}>
              Ir para a página da campanha
            </button>
          )}
          <button onClick={onDontShowAgain}
            className="order-2 sm:order-1 px-4 py-2 sm:py-2.5 rounded-xl font-medium text-sm hover:underline transition-colors"
            style={{ color: bgImage ? text : color }}>
            Não mostrar novamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignModalView;
