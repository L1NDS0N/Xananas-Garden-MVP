/**
 * Seasonal Themes
 * Auto-applies theme colors based on the current date.
 * Campaigns can override these themes.
 */

export interface SeasonalTheme {
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  gradient: string;
  emoji: string;
}

const SEASONAL_THEMES: { start: string; end: string; theme: SeasonalTheme }[] = [
  // Ano Novo (Jan 1-7)
  { start: '01-01', end: '01-07', theme: { name: 'Ano Novo', primary: '#ffd700', secondary: '#1a1a2e', bg: '#fff8e1', gradient: 'from-yellow-400 to-amber-600', emoji: '🎆' } },
  // Dia dos Namorados (Feb 1-15)
  { start: '02-01', end: '02-15', theme: { name: 'Dia dos Namorados', primary: '#e91e63', secondary: '#9c27b0', bg: '#fce4ec', gradient: 'from-pink-500 to-rose-600', emoji: '💝' } },
  // Páscoa (March-April, varies)
  { start: '03-15', end: '04-15', theme: { name: 'Páscoa', primary: '#ff9800', secondary: '#8bc34a', bg: '#fff3e0', gradient: 'from-orange-400 to-amber-500', emoji: '🐰' } },
  // Dia das Mães (May 1-15)
  { start: '05-01', end: '05-15', theme: { name: 'Dia das Mães', primary: '#e91e63', secondary: '#f48fb1', bg: '#fce4ec', gradient: 'from-pink-400 to-rose-500', emoji: '🌸' } },
  // Dia dos Pais (Aug 1-15)
  { start: '08-01', end: '08-15', theme: { name: 'Dia dos Pais', primary: '#3f51b5', secondary: '#7986cb', bg: '#e8eaf6', gradient: 'from-blue-500 to-indigo-600', emoji: '👔' } },
  // Primavera (Sept-Oct)
  { start: '09-01', end: '10-31', theme: { name: 'Primavera', primary: '#4caf50', secondary: '#81c784', bg: '#e8f5e9', gradient: 'from-green-400 to-emerald-500', emoji: '🌿' } },
  // Dia das Crianças (Oct 1-12)
  { start: '10-01', end: '10-12', theme: { name: 'Dia das Crianças', primary: '#ff5722', secondary: '#ff9800', bg: '#fbe9e7', gradient: 'from-orange-400 to-red-500', emoji: '🎈' } },
  // Halloween (Oct 25-31)
  { start: '10-25', end: '10-31', theme: { name: 'Halloween', primary: '#ff6f00', secondary: '#212121', bg: '#fff3e0', gradient: 'from-orange-600 to-gray-900', emoji: '🎃' } },
  // Natal (Dec 1-31)
  { start: '12-01', end: '12-31', theme: { name: 'Natal', primary: '#c62828', secondary: '#2e7d32', bg: '#ffebee', gradient: 'from-red-600 to-green-700', emoji: '🎄' } },
];

export function getCurrentSeasonalTheme(): SeasonalTheme | null {
  const now = new Date();
  const mmdd = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const season of SEASONAL_THEMES) {
    if (mmdd >= season.start && mmdd <= season.end) {
      return season.theme;
    }
  }
  return null;
}

/**
 * Apply seasonal theme as CSS variables on :root
 */
export function applySeasonalTheme(theme: SeasonalTheme | null) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme) {
    root.style.setProperty('--seasonal-primary', theme.primary);
    root.style.setProperty('--seasonal-secondary', theme.secondary);
    root.style.setProperty('--seasonal-bg', theme.bg);
  } else {
    root.style.removeProperty('--seasonal-primary');
    root.style.removeProperty('--seasonal-secondary');
    root.style.removeProperty('--seasonal-bg');
  }
}

export const ALL_SEASONS = SEASONAL_THEMES.map(s => s.theme);
