/**
 * Converts a string into a URL-safe slug.
 * - Lowercases
 * - Removes accents (NFD)
 * - Replaces non-alphanumeric chars with hyphens
 * - Collapses multiple hyphens
 * - Trims leading/trailing hyphens
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensures slug uniqueness by appending a suffix if needed.
 * Pass existing slugs to avoid collisions.
 */
export function uniqueSlug(base: string, existingSlugs: string[]): string {
  let slug = toSlug(base);
  let candidate = slug;
  let counter = 1;

  while (existingSlugs.includes(candidate)) {
    candidate = `${slug}-${counter}`;
    counter++;
  }

  return candidate;
}

/**
 * Extracts YouTube video ID from various URL formats.
 * Returns null if not a valid YouTube URL.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
