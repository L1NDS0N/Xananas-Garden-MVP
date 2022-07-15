/**
 * Shared "Solicitar no WhatsApp" message builder — used by the catalog cards and the
 * product detail page. Uses WhatsApp's own text formatting (*bold*, _italic_) instead
 * of plain text, and intentionally leaves the product description out: it's often long
 * and HTML-formatted, reading poorly pasted into a chat bubble — the link covers that.
 */
export function buildProductInquiryMessage(params: {
  name: string;
  priceLabel: string;
  link?: string;
}): string {
  const { name, priceLabel, link } = params;
  return (
    `Olá! 👋 Tenho interesse neste produto:\n\n` +
    `*${name}*\n` +
    `💰 _Preço:_ ${priceLabel}\n` +
    (link ? `🔗 ${link}\n` : '') +
    `\nPoderia me passar mais informações? 🌸`
  );
}
