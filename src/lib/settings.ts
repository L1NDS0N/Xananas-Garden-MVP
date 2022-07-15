// App settings — WhatsApp links use the logged-in user's phone number
// with fallback to platform default stored in the database

let cachedSettings: Record<string, string> | null = null;
let settingsPromise: Promise<Record<string, string>> | null = null;

/**
 * Fetch platform settings from the database (cached after first call).
 */
async function fetchPlatformSettings(): Promise<Record<string, string>> {
  if (cachedSettings) return cachedSettings;
  if (settingsPromise) return settingsPromise;

  settingsPromise = fetch('/api/v1/settings')
    .then(r => r.ok ? r.json() : {})
    .then(data => {
      cachedSettings = data;
      return data;
    })
    .catch(() => ({}));

  return settingsPromise;
}

/**
 * Get the default WhatsApp number from database settings.
 * Falls back to NEXT_PUBLIC_DEFAULT_WHATSAPP env var.
 */
export async function getDefaultWhatsAppAsync(): Promise<string> {
  const settings = await fetchPlatformSettings();
  return settings.default_whatsapp || process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP || '';
}

/**
 * Synchronous version — returns cached value or env fallback.
 * Use after settings have been fetched at least once.
 */
export function getDefaultWhatsApp(): string {
  return cachedSettings?.default_whatsapp
    || process.env.NEXT_PUBLIC_DEFAULT_WHATSAPP
    || '';
}

/**
 * Normalizes a Brazilian number for wa.me deep links: adds the country code (55)
 * when missing, and — critically — re-inserts the mobile "9" prefix when it's
 * missing, since wa.me reports "isn't on WhatsApp" for a mobile number that's one
 * digit short of the mandatory-since-2016 format, regardless of whether the 9 was
 * never typed in or got lost somewhere upstream. Left untouched for anything that
 * doesn't look like a BR mobile number (landlines, other countries).
 */
export function normalizeBrazilPhone(raw: string): string {
  let digits = (raw || '').replace(/\D/g, '');
  if (!digits) return digits;

  // Bare DDD + number (no country code) — add it
  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
    digits = '55' + digits;
  }

  // 55 + DDD(2) + 8-digit number = 12 digits: a mobile number missing its 9th digit
  if (digits.length === 12 && digits.startsWith('55')) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (/^[6-9]/.test(rest)) {
      digits = `55${ddd}9${rest}`;
    }
  }

  return digits;
}

/**
 * Build WhatsApp URL.
 * Priority: explicit userPhone param > platform DB default > env fallback > empty.
 */
function buildWaUrl(phone: string, message: string): string {
  const clean = normalizeBrazilPhone(phone);
  const base = clean ? `https://wa.me/${clean}` : 'https://wa.me/';
  const params = new URLSearchParams({ text: message });
  return `${base}?${params.toString()}`;
}

/**
 * Build WhatsApp URL.
 * Priority: explicit userPhone param > platform DB default > env fallback > empty.
 */
export async function getWhatsAppUrlAsync(message: string, userPhone?: string): Promise<string> {
  const phone = userPhone || await getDefaultWhatsAppAsync();
  return buildWaUrl(phone, message);
}

/**
 * Build WhatsApp URL synchronously (uses cached settings).
 */
export function getWhatsAppUrl(message: string, userPhone?: string): string {
  const phone = userPhone || getDefaultWhatsApp();
  return buildWaUrl(phone, message);
}

/**
 * Open WhatsApp in a new tab.
 * @param message  Pre-filled message text
 * @param userPhone  The logged-in user's phone number (overrides platform default)
 */
export async function openWhatsApp(message: string, userPhone?: string): Promise<void> {
  const url = await getWhatsAppUrlAsync(message, userPhone);
  window.open(url, '_blank');
}

/**
 * Preload settings into cache (call early in app lifecycle).
 */
export function preloadSettings(): void {
  fetchPlatformSettings();
}
