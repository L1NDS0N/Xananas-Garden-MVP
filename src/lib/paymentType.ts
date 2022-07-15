export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  money: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  other: 'Outros',
};

/**
 * @param customLabels optional key->name map (e.g. built from the live /payment-methods list)
 * consulted first, so custom payment methods registered in Formas de Pagamento resolve to their
 * real name instead of falling back to "Outros".
 */
export function paymentTypeLabel(type?: string | null, customLabels?: Record<string, string>): string {
  if (!type) return PAYMENT_TYPE_LABELS.money;
  return customLabels?.[type] || PAYMENT_TYPE_LABELS[type] || 'Outros';
}
