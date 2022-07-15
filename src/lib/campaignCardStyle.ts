import { CSSProperties } from 'react';

/** The storefront's pastel primary — every campaign accent gets pulled toward this so
 *  admin-picked colors never clash with the site's soft palette. */
const PRIMARY_PASTEL = '#de818d';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return [222, 129, 141]; // fallback to primary pastel
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

/** Linear-interpolates between two hex colors — t=0 is `a`, t=1 is `b`. */
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  return rgbToHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}

/**
 * CSS custom properties consumed by the `.campaign-glow-card` class (globals.css):
 * an "illuminated glass" ring — a rotating conic gradient that sweeps a bright
 * near-white highlight (like light passing through glass) through tints of the
 * campaign's color, always blended toward the pastel primary so it reads as part
 * of the same design language regardless of which color an admin picks.
 */
export function getCampaignGlowStyle(glowColor?: string | null): CSSProperties {
  const raw = glowColor || PRIMARY_PASTEL;
  const c1 = mix(raw, PRIMARY_PASTEL, 0.25); // the campaign's own color, softened toward pastel
  const c2 = mix(PRIMARY_PASTEL, '#ffffff', 0.15); // pastel primary tint
  const c3 = mix(raw, '#ffffff', 0.4); // light glassy tint
  const c4 = mix(raw, '#ffffff', 0.88); // near-white glass highlight — the "light" sweeping through
  return {
    ['--campaign-glow-1' as any]: c1,
    ['--campaign-glow-2' as any]: c2,
    ['--campaign-glow-3' as any]: c3,
    ['--campaign-glow-4' as any]: c4,
  };
}

/** @deprecated use `getCampaignGlowStyle` + the `.campaign-glow-card` class (see CampaignGlowFrame) */
export function getCampaignCardStyle(glowColor?: string | null): CSSProperties {
  return getCampaignGlowStyle(glowColor);
}
