import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import CampaignModalView, { CampaignModalViewCampaign } from '../CampaignModalView';

interface Campaign extends CampaignModalViewCampaign {
  id: string;
  slug?: string | null;
  showModal: boolean;
}

const STORAGE_KEY = 'xananas_campaign_seen';

const CampaignModal: React.FC = () => {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [current, setCurrent] = useState(0);
  const [show, setShow] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    const dismissed = new Set(seen ? seen.split(',').filter(Boolean) : []);

    api.get('/campaigns?public=true').then(r => {
      if (!Array.isArray(r.data) || r.data.length === 0) return;
      const eligible = r.data.filter((c: Campaign) => c.showModal && !dismissed.has(c.id) && (c.modalImage || c.heroImage || c.products?.length > 0));
      if (eligible.length > 0) {
        setCampaigns(eligible);
        setShow(true);
      }
    }).catch(() => {});
  }, []);

  const handleClose = () => setShow(false);

  const handleDontShowAgain = () => {
    const campaign = campaigns[current];
    if (campaign) {
      const seen = localStorage.getItem(STORAGE_KEY);
      const dismissed = new Set(seen ? seen.split(',').filter(Boolean) : []);
      dismissed.add(campaign.id);
      localStorage.setItem(STORAGE_KEY, Array.from(dismissed).join(','));
    }
    const remaining = campaigns.filter((_, i) => i !== current);
    if (remaining.length === 0) { setShow(false); return; }
    setCampaigns(remaining);
    setCurrent(prev => Math.min(prev, remaining.length - 1));
  };

  const handleGoToCampaign = () => {
    const campaign = campaigns[current];
    if (!campaign?.slug) return;
    setShow(false);
    router.push(`/campanha/${campaign.slug}`);
  };

  const handleAddToCart = (product: any) => {
    addItem({ productId: product.id, name: product.name, price: product.price || 0, image: product.images?.[0]?.image });
  };

  if (!show || campaigns.length === 0) return null;
  const campaign = campaigns[current];
  if (!campaign) return null;

  return (
    <CampaignModalView
      campaign={campaign}
      onClose={handleClose}
      onDontShowAgain={handleDontShowAgain}
      onGoToCampaign={campaign.slug ? handleGoToCampaign : undefined}
      onAddToCart={handleAddToCart}
      totalCampaigns={campaigns.length}
      currentIndex={current}
      onPrevCampaign={campaigns.length > 1 ? () => setCurrent(prev => (prev - 1 + campaigns.length) % campaigns.length) : undefined}
      onNextCampaign={campaigns.length > 1 ? () => setCurrent(prev => (prev + 1) % campaigns.length) : undefined}
    />
  );
};

export default CampaignModal;
