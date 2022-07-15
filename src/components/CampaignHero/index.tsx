import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CaretLeft, CaretRight, Sparkle } from 'phosphor-react';
import { api } from '../../lib/api';
import { extractYouTubeId } from '../../lib/slugify';
import ProductCarousel from '../ProductCarousel';
import { CampaignModalProductLike } from '../../types/campaign';

interface Campaign {
  id: string;
  name: string;
  slug?: string | null;
  heroTitle?: string;
  heroSubtitle?: string;
  themeColor?: string;
  bgColor?: string;
  textColor?: string;
  glowColor?: string | null;
  heroImage?: string;
  heroVideo?: string;
  discountType: string;
  discountValue: number;
  products?: CampaignModalProductLike[];
}

const CampaignHero: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api.get('/campaigns?public=true').then(r => {
      if (Array.isArray(r.data)) setCampaigns(r.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (campaigns.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % campaigns.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [campaigns.length]);

  if (campaigns.length === 0) return null;

  const campaign = campaigns[current];
  const color = campaign.themeColor || '#de818d';
  const bg = campaign.bgColor || '#fff0f3';
  const text = campaign.textColor || '#ffffff';
  const glow = campaign.glowColor || color;
  const ytId = campaign.heroVideo ? extractYouTubeId(campaign.heroVideo) : null;
  const hasMedia = !!(campaign.heroImage || ytId);
  const hasProducts = !!campaign.products && campaign.products.length > 0;

  return (
    <div key={campaign.id} className="relative w-full overflow-hidden rounded-2xl mb-6 animate-fadeIn"
      style={{ backgroundColor: bg, boxShadow: `0 8px 30px -12px ${glow}66` }}>
      {/* Media / gradient background — stretches behind both the text and the carousel below */}
      <div className="relative w-full">
        <div className="absolute inset-0">
          {hasMedia ? (
            <>
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
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/70" />
            </>
          ) : (
            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${bg}, ${color}25)` }} />
          )}
        </div>

        {/* Text — fixed height (not aspect-ratio based) so the hero stays compact on wide desktop screens */}
        <div className="relative h-44 sm:h-48 md:h-56 flex items-center">
          <div className="w-full px-6 md:px-10 py-4 md:py-6">
            <div className="max-w-lg animate-fadeInUp">
              <div className="inline-flex items-center gap-1.5 mb-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                style={{ backgroundColor: color, color: text }}>
                <Sparkle size={12} weight="fill" />
                {campaign.discountType === 'percentage' ? `${campaign.discountValue}% OFF` : `R$ ${campaign.discountValue} OFF`}
              </div>
              <h2 className="text-xl md:text-3xl font-bold mb-1 leading-tight" style={{ color: hasMedia ? text : color }}>
                {campaign.heroTitle || campaign.name}
              </h2>
              {campaign.heroSubtitle && (
                <p className="text-xs md:text-sm opacity-90 line-clamp-2" style={{ color: hasMedia ? text : '#6b7280' }}>
                  {campaign.heroSubtitle}
                </p>
              )}
              {campaign.slug && (
                <Link href={`/campanha/${campaign.slug}`}
                  className="inline-block mt-3 px-4 py-1.5 rounded-full text-xs font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: hasMedia ? text : color, color: hasMedia ? color : text }}>
                  Ver campanha
                </Link>
              )}
            </div>
          </div>

          {/* Navigation between multiple active campaigns — anchored to the text/image area */}
          {campaigns.length > 1 && (
            <>
              <button onClick={() => setCurrent(prev => (prev - 1 + campaigns.length) % campaigns.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10">
                <CaretLeft size={18} className="text-gray-700" />
              </button>
              <button onClick={() => setCurrent(prev => (prev + 1) % campaigns.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all z-10">
                <CaretRight size={18} className="text-gray-700" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {campaigns.map((c, i) => (
                  <button key={c.id} onClick={() => setCurrent(i)} title={c.name}
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: i === current ? 20 : 6, backgroundColor: i === current ? color : 'rgba(255,255,255,0.6)' }} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Embedded product carousel — a glassmorphic panel floating over the same background image */}
        {hasProducts && (
          <div className="relative px-3 md:px-5 pb-3 md:pb-4 animate-fadeIn">
            <div className={`h-24 sm:h-28 rounded-2xl p-2 ${hasMedia ? 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl' : ''}`}>
              <ProductCarousel
                products={campaign.products!}
                accentColor={color}
                campaignDiscountType={campaign.discountType}
                campaignDiscountValue={campaign.discountValue}
                dark={hasMedia}
                compact
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignHero;
