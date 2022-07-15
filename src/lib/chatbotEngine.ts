/**
 * Rule-based intent + relevance-ranking engine for the storefront chatbot.
 * No external AI API — everything is driven by the store's own live data
 * (products, categories, active campaigns), so answers are always accurate
 * to what's actually in stock/on sale right now.
 */
import { getCampaignDisplayPrice } from './campaignPricing';

export interface ChatProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  amount: number;
  published: boolean;
  category?: { id: string; name: string } | null;
  tags?: string | null;
  images?: { image: string }[];
  createdAt?: string;
}

export interface ChatCategory {
  id: string;
  name: string;
}

export interface ChatCampaignProduct {
  productId: string;
  promoPrice?: number | null;
  discountType?: string | null;
  discountValue?: number | null;
  highlightColor?: string | null;
}

export interface ChatCampaign {
  id: string;
  name: string;
  slug?: string | null;
  themeColor?: string | null;
  discountType: string;
  discountValue: number;
  products: ChatCampaignProduct[];
}

export type ChatIntent =
  | 'greeting'
  | 'seller'
  | 'shipping'
  | 'promotions'
  | 'stock'
  | 'price'
  | 'categories'
  | 'featured'
  | 'thanks'
  | 'search'
  | 'unknown';

const STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
  'que', 'quero', 'queria', 'gostaria', 'voce', 'voces', 'tem', 'tém', 'ter', 'qual', 'quais', 'como', 'por', 'favor',
  'pra', 'para', 'com', 'sem', 'e', 'ou', 'meu', 'minha', 'meus', 'minhas', 'preco', 'valor', 'quanto', 'custa',
  'onde', 'comprar', 'ver', 'vejo', 'mostra', 'mostrar', 'me', 'eu', 'ai', 'la', 'aqui', 'esse', 'essa', 'esses',
  'essas', 'este', 'esta', 'estes', 'estas', 'isso', 'isto', 'tem', 'sao', 'eh', 'ola', 'oi',
]);

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (combining diacritical marks)
    .trim();
}

export function tokenize(str: string): string[] {
  return normalize(str)
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
}

const includesAny = (msg: string, phrases: string[]) => phrases.some(p => msg.includes(p));

/** Classifies a user message into one of the store's known intents. */
export function detectIntent(rawMessage: string): ChatIntent {
  const msg = normalize(rawMessage);

  if (includesAny(msg, ['obrigad', 'valeu', 'brigad'])) return 'thanks';
  if (includesAny(msg, ['bom dia', 'boa tarde', 'boa noite', 'ola', 'oi ', 'ola!', 'eae', 'e ai']) || msg === 'oi') return 'greeting';
  if (includesAny(msg, ['vendedor', 'atendente', 'humano', 'whatsapp', 'zap', 'falar com'])) return 'seller';
  if (includesAny(msg, ['frete', 'entrega', 'envio', 'envia', 'prazo de entrega', 'chega quando'])) return 'shipping';
  if (includesAny(msg, ['promo', 'desconto', 'oferta', 'campanha', 'liquidacao', 'cupom'])) return 'promotions';
  if (includesAny(msg, ['estoque', 'disponivel', 'tem essa', 'ainda tem', 'em estoque'])) return 'stock';
  if (includesAny(msg, ['preco', 'valor', 'quanto custa', 'quanto e', 'quanto sai'])) return 'price';
  if (includesAny(msg, ['categoria', 'categorias', 'o que voces tem', 'o que tem na loja', 'tipos de produto'])) return 'categories';
  if (includesAny(msg, ['destaque', 'mais vendido', 'recomenda', 'sugestao', 'novidade', 'lancamento'])) return 'featured';

  return 'search';
}

function scoreProduct(product: ChatProduct, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const name = normalize(product.name);
  const cat = product.category ? normalize(product.category.name) : '';
  const tags = product.tags ? normalize(product.tags) : '';
  let score = 0;
  for (const token of tokens) {
    if (name === token) score += 6;
    else if (name.includes(token)) score += 3;
    if (cat.includes(token)) score += 2;
    if (tags.includes(token)) score += 1.5;
  }
  return score;
}

/** Ranks the live catalog against a free-text query — the core "search intelligence". */
export function searchProducts(products: ChatProduct[], query: string, limit = 4): ChatProduct[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const available = products.filter(p => p.published);
  const scored = available
    .map(p => ({ p, score: scoreProduct(p, tokens) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || (b.p.amount > 0 ? 1 : 0) - (a.p.amount > 0 ? 1 : 0));

  return scored.slice(0, limit).map(s => s.p);
}

export function findCategoryMatch(categories: ChatCategory[], query: string): ChatCategory | null {
  const tokens = tokenize(query);
  if (tokens.length === 0) return null;
  return categories.find(c => {
    const name = normalize(c.name);
    return tokens.some(t => name.includes(t) || t.includes(name));
  }) || null;
}

export interface PricedProduct {
  product: ChatProduct;
  price: number;
  original: number;
  isPromo: boolean;
  campaignName?: string;
}

/** Resolves a product's real, current price — including any active campaign discount. */
export function priceForProduct(product: ChatProduct, campaigns: ChatCampaign[]): PricedProduct {
  for (const campaign of campaigns) {
    const cp = campaign.products.find(p => p.productId === product.id);
    if (cp) {
      const dp = getCampaignDisplayPrice(product.price || 0, {
        promoPrice: cp.promoPrice,
        discountType: cp.discountType,
        discountValue: cp.discountValue,
        campaignDiscountType: campaign.discountType,
        campaignDiscountValue: campaign.discountValue,
      });
      return { product, price: dp.price, original: dp.original, isPromo: dp.isPromo, campaignName: dp.isPromo ? campaign.name : undefined };
    }
  }
  return { product, price: product.price || 0, original: product.price || 0, isPromo: false };
}

/** Recently-viewed-aware recommendations: same category as last viewed product, else newest additions. */
export function featuredProducts(products: ChatProduct[], viewedProductNames: string[], limit = 4): ChatProduct[] {
  const available = products.filter(p => p.published && p.amount > 0);
  if (viewedProductNames.length > 0) {
    const lastViewed = viewedProductNames[viewedProductNames.length - 1];
    const match = searchProducts(available, lastViewed, 1)[0];
    if (match?.category) {
      const related = available.filter(p => p.category?.id === match.category!.id && p.id !== match.id);
      if (related.length > 0) return related.slice(0, limit);
    }
  }
  return [...available]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit);
}
