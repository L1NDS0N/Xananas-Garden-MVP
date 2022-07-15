import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { paymentTypeLabel } from '../../../../lib/paymentType';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// pdfmake v0.3.x: fonts are top-level keys in the module
(pdfMake as any).vfs = pdfFonts;

const STYLES = {
  header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] as [number, number, number, number] },
  subheader: { fontSize: 10, color: '#666', margin: [0, 0, 0, 15] as [number, number, number, number] },
  tableHeader: { bold: true, fontSize: 9, color: 'white', fillColor: '#de818d' },
  footer: { fontSize: 9, color: '#666', margin: [0, 15, 0, 0] as [number, number, number, number] },
  summaryTitle: { fontSize: 12, bold: true, margin: [0, 15, 0, 8] as [number, number, number, number] },
};

function buildDateWhere(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return {};
  const where: any = { createdAt: {} };
  if (startDate) where.createdAt.gte = new Date(startDate);
  if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
  return where;
}

function formatCurrency(v: number) {
  return `R$ ${v.toFixed(2)}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, startDate, endDate, topN } = req.body;
    const where = buildDateWhere(startDate, endDate);
    let docDefinition: any;

    switch (type) {

      /* ===== 1. ESTOQUE ===== */
      case 'stock': {
        const products = await prisma.product.findMany({
          include: { category: true },
          orderBy: { name: 'asc' },
        });
        const rows = products.map((p: any) => [
          p.name, p.category?.name || '-', String(p.amount || 0), p.price ? formatCurrency(p.price) : '-',
        ]);
        docDefinition = {
          content: [
            { text: 'Relatório de Estoque', style: 'header' },
            { text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, style: 'subheader' },
            { table: { headerRows: 1, widths: ['*', '*', 'auto', 'auto'], body: [
              [{ text: 'Produto', style: 'tableHeader' }, { text: 'Categoria', style: 'tableHeader' }, { text: 'Qtd', style: 'tableHeader' }, { text: 'Preço', style: 'tableHeader' }],
              ...rows,
            ]}},
            { text: `\nTotal: ${products.length} produtos | ${products.reduce((s: number, p: any) => s + (p.amount || 0), 0)} unidades em estoque`, style: 'footer' },
          ],
          styles: STYLES,
        };
        break;
      }

      /* ===== 2. VENDAS (histórico simples) ===== */
      case 'sales': {
        const sales = await prisma.sale.findMany({
          where,
          include: {
            items: { include: { product: { select: { name: true, costPrice: true } } } },
            user: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        // Profit only counts items whose product has a registered cost price, with the sale's
        // discount spread proportionally (by value) across those items.
        const saleProfit = (s: any): number | null => {
          const withCost = s.items.filter((i: any) => i.product?.costPrice != null);
          if (withCost.length === 0) return null;
          const itemsProfit = withCost.reduce((sum: number, i: any) => sum + (i.unitPrice - i.product.costPrice) * i.quantity, 0);
          const totalSubtotal = s.items.reduce((sum: number, i: any) => sum + i.subtotal, 0) || 1;
          const costTrackedSubtotal = withCost.reduce((sum: number, i: any) => sum + i.subtotal, 0);
          return itemsProfit - s.discount * (costTrackedSubtotal / totalSubtotal);
        };
        const rows = sales.map((s: any) => {
          const profit = saleProfit(s);
          return [
            new Date(s.createdAt).toLocaleDateString('pt-BR'),
            s.user?.name || '-',
            paymentTypeLabel(s.paymentType),
            `${s.items.length} itens`,
            formatCurrency(s.finalTotal),
            profit == null ? '-' : { text: formatCurrency(profit), color: profit >= 0 ? 'green' : 'red' },
          ];
        });
        const total = sales.reduce((sum: number, s: any) => sum + s.finalTotal, 0);
        const totalProfit = sales.reduce((sum: number, s: any) => sum + (saleProfit(s) || 0), 0);
        const trackedCount = sales.filter((s: any) => saleProfit(s) != null).length;
        docDefinition = {
          content: [
            { text: 'Relatório de Vendas', style: 'header' },
            { text: `Período: ${startDate || 'Início'} → ${endDate || 'Atual'}`, style: 'subheader' },
            { table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'], body: [
              [{ text: 'Data', style: 'tableHeader' }, { text: 'Atendente', style: 'tableHeader' }, { text: 'Pagamento', style: 'tableHeader' }, { text: 'Itens', style: 'tableHeader' }, { text: 'Total', style: 'tableHeader' }, { text: 'Lucro', style: 'tableHeader' }],
              ...rows,
            ]}},
            { text: `\nTotal: ${sales.length} vendas | Receita: ${formatCurrency(total)}` +
              (trackedCount > 0 ? ` | Lucro (${trackedCount} vendas com custo cadastrado): ${formatCurrency(totalProfit)}` : ''), style: 'footer' },
          ],
          styles: STYLES,
        };
        break;
      }

      /* ===== 3. FLUXO DE CAIXA ===== */
      case 'cashflow': {
        const flows = await prisma.cashFlow.findMany({
          where,
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        });
        const rows = flows.map((f: any) => [
          new Date(f.createdAt).toLocaleDateString('pt-BR'),
          f.type === 'entry' ? 'Entrada' : f.type === 'exit' ? 'Saída' : f.type === 'opening' ? 'Abertura' : 'Fechamento',
          f.description,
          f.user?.name || '-',
          { text: formatCurrency(Math.abs(f.amount)), color: f.amount >= 0 ? 'green' : 'red' },
        ]);
        const totalE = flows.filter((f: any) => f.amount > 0).reduce((s: number, f: any) => s + f.amount, 0);
        const totalX = flows.filter((f: any) => f.amount < 0).reduce((s: number, f: any) => s + Math.abs(f.amount), 0);
        docDefinition = {
          content: [
            { text: 'Relatório de Fluxo de Caixa', style: 'header' },
            { text: `Período: ${startDate || 'Início'} → ${endDate || 'Atual'}`, style: 'subheader' },
            { table: { headerRows: 1, widths: ['auto', 'auto', '*', '*', 'auto'], body: [
              [{ text: 'Data', style: 'tableHeader' }, { text: 'Tipo', style: 'tableHeader' }, { text: 'Descrição', style: 'tableHeader' }, { text: 'Responsável', style: 'tableHeader' }, { text: 'Valor', style: 'tableHeader' }],
              ...rows,
            ]}},
            { text: `\nEntradas: ${formatCurrency(totalE)} | Saídas: ${formatCurrency(totalX)} | Saldo: ${formatCurrency(totalE - totalX)}`, style: 'footer' },
          ],
          styles: STYLES,
        };
        break;
      }

      /* ===== 4. VENDAS POR PERÍODO ===== */
      case 'sales-by-period': {
        const sales = await prisma.sale.findMany({
          where,
          include: { items: true, user: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        });

        const byDay: Record<string, { count: number; total: number; cash: number; card: number; pix: number; other: number }> = {};
        for (const s of sales) {
          const key = new Date(s.createdAt).toLocaleDateString('pt-BR');
          if (!byDay[key]) byDay[key] = { count: 0, total: 0, cash: 0, card: 0, pix: 0, other: 0 };
          byDay[key].count++;
          byDay[key].total += s.finalTotal;
          if (s.paymentType === 'money') byDay[key].cash += s.finalTotal;
          else if (s.paymentType === 'card') byDay[key].card += s.finalTotal;
          else if (s.paymentType === 'pix') byDay[key].pix += s.finalTotal;
          else byDay[key].other += s.finalTotal;
        }

        const dayRows = Object.entries(byDay).map(([day, d]) => [
          day, String(d.count), formatCurrency(d.total),
          formatCurrency(d.cash), formatCurrency(d.card), formatCurrency(d.pix), formatCurrency(d.other),
        ]);

        const grandTotal = sales.reduce((s: number, v: any) => s + v.finalTotal, 0);
        const grandCash = sales.filter((s: any) => s.paymentType === 'money').reduce((s: number, v: any) => s + v.finalTotal, 0);
        const grandCard = sales.filter((s: any) => s.paymentType === 'card').reduce((s: number, v: any) => s + v.finalTotal, 0);
        const grandPix = sales.filter((s: any) => s.paymentType === 'pix').reduce((s: number, v: any) => s + v.finalTotal, 0);
        const grandOther = sales.filter((s: any) => s.paymentType && !['money', 'card', 'pix'].includes(s.paymentType)).reduce((s: number, v: any) => s + v.finalTotal, 0);
        const avgTicket = sales.length > 0 ? grandTotal / sales.length : 0;

        docDefinition = {
          content: [
            { text: 'Vendas por Período', style: 'header' },
            { text: `Período: ${startDate || 'Início'} → ${endDate || 'Atual'} | ${sales.length} vendas`, style: 'subheader' },
            { table: { headerRows: 1, widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], body: [
              [{ text: 'Data', style: 'tableHeader' }, { text: 'Qtd', style: 'tableHeader' }, { text: 'Total', style: 'tableHeader' }, { text: 'Dinheiro', style: 'tableHeader' }, { text: 'Cartão', style: 'tableHeader' }, { text: 'PIX', style: 'tableHeader' }, { text: 'Outros', style: 'tableHeader' }],
              ...dayRows,
            ]}},
            { text: 'Resumo', style: 'summaryTitle' },
            { text: [
              { text: `Receita: `, bold: true }, formatCurrency(grandTotal), '  ',
              { text: `Ticket Médio: `, bold: true }, formatCurrency(avgTicket), '  ',
              { text: `Dinheiro: `, bold: true }, formatCurrency(grandCash), '  ',
              { text: `Cartão: `, bold: true }, formatCurrency(grandCard), '  ',
              { text: `PIX: `, bold: true }, formatCurrency(grandPix), '  ',
              { text: `Outros: `, bold: true }, formatCurrency(grandOther),
            ], style: 'footer' },
          ],
          styles: STYLES,
        };
        break;
      }

      /* ===== 5. PRODUTOS MAIS VENDIDOS ===== */
      case 'top-products': {
        const limit = topN || 20;
        const saleItems = await prisma.saleItem.findMany({
          where: { sale: where },
          include: { product: { select: { id: true, name: true, price: true, category: { select: { name: true } } } } },
        });

        const agg: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
        for (const item of saleItems) {
          const pid = item.productId;
          if (!agg[pid]) agg[pid] = { name: item.product.name, category: item.product.category?.name || '-', qty: 0, revenue: 0 };
          agg[pid].qty += item.quantity;
          agg[pid].revenue += item.subtotal;
        }

        const ranked = Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, limit);
        const totalQty = ranked.reduce((s, r) => s + r.qty, 0);
        const totalRev = ranked.reduce((s, r) => s + r.revenue, 0);

        const rows = ranked.map((r, i) => [
          `${i + 1}º`, r.name, r.category, String(r.qty), formatCurrency(r.revenue),
          `${((r.qty / (totalQty || 1)) * 100).toFixed(1)}%`,
        ]);

        docDefinition = {
          content: [
            { text: 'Produtos Mais Vendidos', style: 'header' },
            { text: `Top ${limit} | ${startDate || 'Início'} → ${endDate || 'Atual'}`, style: 'subheader' },
            { table: { headerRows: 1, widths: ['auto', '*', '*', 'auto', 'auto', 'auto'], body: [
              [{ text: '#', style: 'tableHeader' }, { text: 'Produto', style: 'tableHeader' }, { text: 'Categoria', style: 'tableHeader' }, { text: 'Qtd', style: 'tableHeader' }, { text: 'Receita', style: 'tableHeader' }, { text: '%', style: 'tableHeader' }],
              ...rows,
            ]}},
            { text: `\nTotal: ${totalQty} unidades | Receita: ${formatCurrency(totalRev)}`, style: 'footer' },
          ],
          styles: STYLES,
        };
        break;
      }

      /* ===== 6. DESEMPENHO POR FUNCIONÁRIO ===== */
      case 'employee-performance': {
        const sales = await prisma.sale.findMany({
          where,
          include: { items: true, user: { select: { id: true, name: true } } },
        });

        const byUser: Record<string, { name: string; salesCount: number; totalRevenue: number; totalItems: number; avgTicket: number; cash: number; card: number; pix: number; other: number }> = {};
        for (const s of sales) {
          const uid = s.userId || 'unknown';
          if (!byUser[uid]) byUser[uid] = { name: s.user?.name || 'Desconhecido', salesCount: 0, totalRevenue: 0, totalItems: 0, avgTicket: 0, cash: 0, card: 0, pix: 0, other: 0 };
          byUser[uid].salesCount++;
          byUser[uid].totalRevenue += s.finalTotal;
          byUser[uid].totalItems += s.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
          if (s.paymentType === 'money') byUser[uid].cash += s.finalTotal;
          else if (s.paymentType === 'card') byUser[uid].card += s.finalTotal;
          else if (s.paymentType === 'pix') byUser[uid].pix += s.finalTotal;
          else byUser[uid].other += s.finalTotal;
        }

        for (const uid of Object.keys(byUser)) {
          byUser[uid].avgTicket = byUser[uid].salesCount > 0 ? byUser[uid].totalRevenue / byUser[uid].salesCount : 0;
        }

        const ranked = Object.values(byUser).sort((a, b) => b.totalRevenue - a.totalRevenue);
        const grandTotal = ranked.reduce((s, r) => s + r.totalRevenue, 0);
        const grandSales = ranked.reduce((s, r) => s + r.salesCount, 0);

        const rows = ranked.map((r, i) => [
          `${i + 1}º`, r.name, String(r.salesCount), String(r.totalItems),
          formatCurrency(r.totalRevenue), formatCurrency(r.avgTicket),
        ]);

        const summaryRows = ranked.map((r, i) => [
          `${i + 1}º`, r.name,
          formatCurrency(r.cash), formatCurrency(r.card), formatCurrency(r.pix), formatCurrency(r.other),
          formatCurrency(r.totalRevenue),
        ]);

        docDefinition = {
          content: [
            { text: 'Desempenho por Funcionário', style: 'header' },
            { text: `Período: ${startDate || 'Início'} → ${endDate || 'Atual'}`, style: 'subheader' },
            { text: 'Ranking Geral', style: 'summaryTitle' },
            { table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto'], body: [
              [{ text: '#', style: 'tableHeader' }, { text: 'Funcionário', style: 'tableHeader' }, { text: 'Vendas', style: 'tableHeader' }, { text: 'Itens', style: 'tableHeader' }, { text: 'Receita', style: 'tableHeader' }, { text: 'Ticket Médio', style: 'tableHeader' }],
              ...rows,
            ]}},
            { text: 'Por Forma de Pagamento', style: 'summaryTitle' },
            { table: { headerRows: 1, widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'], body: [
              [{ text: '#', style: 'tableHeader' }, { text: 'Funcionário', style: 'tableHeader' }, { text: 'Dinheiro', style: 'tableHeader' }, { text: 'Cartão', style: 'tableHeader' }, { text: 'PIX', style: 'tableHeader' }, { text: 'Outros', style: 'tableHeader' }, { text: 'Total', style: 'tableHeader' }],
              ...summaryRows,
            ]}},
            { text: `\nTotal: ${grandSales} vendas | ${formatCurrency(grandTotal)}`, style: 'footer' },
          ],
          styles: STYLES,
        };
        break;
      }

      /* ===== 7. COMPRAS ===== */
      case 'purchases': {
        const purchases = await prisma.purchase.findMany({
          where,
          include: {
            supplier: { select: { name: true } },
            user: { select: { name: true } },
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        });
        const rows = purchases.map((p: any) => [
          new Date(p.createdAt).toLocaleDateString('pt-BR'),
          p.type === 'stock' ? 'Estoque' : 'Avulsa',
          p.supplier?.name || '-',
          p.invoice || '-',
          p.user?.name || '-',
          `${p.items.length} itens`,
          formatCurrency(p.total),
        ]);
        const total = purchases.reduce((sum: number, p: any) => sum + p.total, 0);
        docDefinition = {
          content: [
            { text: 'Relatório de Compras', style: 'header' },
            { text: `Período: ${startDate || 'Início'} → ${endDate || 'Atual'}`, style: 'subheader' },
            { table: { headerRows: 1, widths: ['auto', 'auto', '*', 'auto', '*', 'auto', 'auto'], body: [
              [{ text: 'Data', style: 'tableHeader' }, { text: 'Tipo', style: 'tableHeader' }, { text: 'Fornecedor', style: 'tableHeader' }, { text: 'NF', style: 'tableHeader' }, { text: 'Responsável', style: 'tableHeader' }, { text: 'Itens', style: 'tableHeader' }, { text: 'Total', style: 'tableHeader' }],
              ...rows,
            ]}},
            { text: `\nTotal: ${purchases.length} compras | Gasto: ${formatCurrency(total)}`, style: 'footer' },
          ],
          styles: STYLES,
        };
        break;
      }

      /* ===== 8. FORNECEDORES ===== */
      case 'suppliers': {
        const suppliers = await prisma.supplier.findMany({
          include: {
            products: { select: { id: true } },
            purchases: { select: { total: true } },
          },
          orderBy: { name: 'asc' },
        });
        const rows = suppliers.map((s: any) => [
          s.name,
          s.cnpj || '-',
          s.phone || s.whatsapp || '-',
          s.active ? 'Ativo' : 'Inativo',
          String(s.products.length),
          String(s.purchases.length),
          formatCurrency(s.purchases.reduce((sum: number, p: any) => sum + p.total, 0)),
        ]);
        const totalSpent = suppliers.reduce((sum: number, s: any) => sum + s.purchases.reduce((ps: number, p: any) => ps + p.total, 0), 0);
        docDefinition = {
          content: [
            { text: 'Relatório de Fornecedores', style: 'header' },
            { text: `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, style: 'subheader' },
            { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'], body: [
              [{ text: 'Fornecedor', style: 'tableHeader' }, { text: 'CNPJ', style: 'tableHeader' }, { text: 'Contato', style: 'tableHeader' }, { text: 'Status', style: 'tableHeader' }, { text: 'Produtos', style: 'tableHeader' }, { text: 'Compras', style: 'tableHeader' }, { text: 'Gasto Total', style: 'tableHeader' }],
              ...rows,
            ]}},
            { text: `\nTotal: ${suppliers.length} fornecedores | Gasto acumulado: ${formatCurrency(totalSpent)}`, style: 'footer' },
          ],
          styles: STYLES,
        };
        break;
      }

      /* ===== 9. USO DE CUPONS ===== */
      case 'coupon-usage': {
        const usages = await prisma.couponUsage.findMany({
          where,
          include: {
            coupon: { select: { code: true, discountType: true, discountValue: true } },
            user: { select: { name: true } },
            sale: { select: { finalTotal: true } },
          },
          orderBy: { createdAt: 'desc' },
        });
        const rows = usages.map((u: any) => [
          new Date(u.createdAt).toLocaleDateString('pt-BR'),
          u.coupon.code,
          u.user?.name || '-',
          formatCurrency(u.discountAmount),
          formatCurrency(u.sale?.finalTotal || 0),
        ]);
        const totalDiscount = usages.reduce((sum: number, u: any) => sum + u.discountAmount, 0);
        docDefinition = {
          content: [
            { text: 'Relatório de Uso de Cupons', style: 'header' },
            { text: `Período: ${startDate || 'Início'} → ${endDate || 'Atual'}`, style: 'subheader' },
            { table: { headerRows: 1, widths: ['auto', 'auto', '*', 'auto', 'auto'], body: [
              [{ text: 'Data', style: 'tableHeader' }, { text: 'Cupom', style: 'tableHeader' }, { text: 'Usado por', style: 'tableHeader' }, { text: 'Desconto', style: 'tableHeader' }, { text: 'Total da Venda', style: 'tableHeader' }],
              ...rows,
            ]}},
            { text: `\nTotal: ${usages.length} usos | Desconto concedido: ${formatCurrency(totalDiscount)}`, style: 'footer' },
          ],
          styles: STYLES,
        };
        break;
      }

      /* ===== 10. RECIBO DE VENDA (individual) ===== */
      case 'receipt': {
        const { saleId } = req.body;
        if (!saleId) return res.status(400).json({ error: 'saleId é obrigatório' });

        const sale = await prisma.sale.findUnique({
          where: { id: saleId },
          include: {
            items: { include: { product: { select: { name: true } } } },
            user: { select: { name: true } },
            client: { select: { name: true, phone: true } },
          },
        });
        if (!sale) return res.status(404).json({ error: 'Venda não encontrada' });

        const paymentLabel = paymentTypeLabel(sale.paymentType);
        const itemRows = sale.items.map((item: any) => [
          item.product.name,
          String(item.quantity),
          formatCurrency(item.unitPrice),
          formatCurrency(item.subtotal),
        ]);

        docDefinition = {
          content: [
            { text: 'Xananas\' Garden', style: 'header', alignment: 'center' },
            { text: 'Rua Bacharel Raimundo Mendes, 685\nNovo Amarante — São Gonçalo do Amarante, RN', style: 'subheader', alignment: 'center' },
            { text: `Recibo de Venda #${sale.id.slice(0, 8)}`, style: 'summaryTitle', alignment: 'center' },
            { text: `Data: ${new Date(sale.createdAt).toLocaleString('pt-BR')}`, style: 'subheader' },
            sale.client ? { text: `Cliente: ${sale.client.name}`, style: 'subheader' } : {},
            { text: `Atendente: ${sale.user?.name || '-'}`, style: 'subheader' },
            { text: `Pagamento: ${paymentLabel}`, style: 'subheader' },
            { text: 'Itens', style: 'summaryTitle' },
            { table: { headerRows: 1, widths: ['*', 'auto', 'auto', 'auto'], body: [
              [{ text: 'Produto', style: 'tableHeader' }, { text: 'Qtd', style: 'tableHeader' }, { text: 'Preço', style: 'tableHeader' }, { text: 'Subtotal', style: 'tableHeader' }],
              ...itemRows,
            ]}},
            { text: '', margin: [0, 5, 0, 5] as [number, number, number, number] },
            { text: `Subtotal: ${formatCurrency(sale.total)}`, alignment: 'right' },
            sale.discount > 0 ? { text: `Desconto: -${formatCurrency(sale.discount)}`, alignment: 'right', color: 'green' } : {},
            { text: `Total: ${formatCurrency(sale.finalTotal)}`, alignment: 'right', bold: true, fontSize: 14, color: '#de818d' },
            { text: '\nObrigado pela preferência! 🌸', style: 'footer', alignment: 'center' },
          ],
          styles: STYLES,
        };
        break;
      }

      default:
        return res.status(400).json({ error: 'Tipo inválido' });
    }

    // pdfmake v0.3.x getBlob() returns a Promise<Blob>
    const blob = await (pdfMake as any).createPdf(docDefinition).getBlob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    const filename = type === 'receipt' ? `recibo-${(req.body as any).saleId?.slice(0, 8) || Date.now()}.pdf` : `relatorio-${type}-${Date.now()}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);

  } catch (error: any) {
    console.error('PDF report error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
