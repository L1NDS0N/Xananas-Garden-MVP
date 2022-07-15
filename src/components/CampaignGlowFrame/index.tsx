import React from 'react';
import { getCampaignGlowStyle } from '../../lib/campaignCardStyle';

interface CampaignGlowFrameProps {
  /** The campaign's highlight/glow color — blended toward the pastel primary automatically */
  glowColor?: string | null;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * Wraps a product card that belongs to an active campaign with an animated
 * conic-gradient glass border (see .campaign-glow-card in globals.css), instead
 * of the old flat diagonal gloss overlay. Keep this wrapper's own className to
 * layout-only concerns (rounding, margin) — visuals live in the CSS class.
 */
const CampaignGlowFrame: React.FC<CampaignGlowFrameProps> = ({ glowColor, className = '', style, children }) => (
  <div className={`campaign-glow-card ${className}`} style={{ ...getCampaignGlowStyle(glowColor), ...style }}>
    {children}
  </div>
);

export default CampaignGlowFrame;
