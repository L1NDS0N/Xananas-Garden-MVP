import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import AdminHeader from '../../../../components/AdminHeader';
import AdminSidebar from '../../../../components/AdminSidebar';
import AuthGuard from '../../../../components/AuthGuard';
import DefaultPage from '../../../../components/DefaultPage';
import { useToast } from '../../../../components/Toast';
import { api } from '../../../../lib/api';
import {
  FilePdf, Calendar, TrendUp, Users, Package, ShoppingCart,
  ChartLineUp, Download, Clock, Eye, X, Printer
} from 'phosphor-react';
import AnimatedLogo from '../../../../components/AnimatedLogo';

const REPORTS = [
  { key: 'sales-by-period', title: 'Vendas por Período', description: 'Vendas agrupadas por dia com detalhamento por forma de pagamento', icon: ChartLineUp, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'top-products', title: 'Produtos Mais Vendidos', description: 'Ranking dos produtos com maior saída e receita gerada', icon: TrendUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  { key: 'employee-performance', title: 'Desempenho por Funcionário', description: 'Vendas, ticket médio e forma de pagamento por atendente', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  { key: 'sales', title: 'Histórico de Vendas', description: 'Lista completa de vendas no período selecionado', icon: ShoppingCart, color: 'text-[#de818d]', bg: 'bg-pink-50', border: 'border-pink-200' },
  { key: 'stock', title: 'Relatório de Estoque', description: 'Estoque atual de todos os produtos com categorias e preços', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'cashflow', title: 'Fluxo de Caixa', description: 'Entradas, saídas, abertura/fechamento e saldo do período', icon: Clock, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
];

type ReportKey = typeof REPORTS[number]['key'];

/** Extract error message from axios blob error response */
function extractError(err: any): string {
  if (err.response?.data instanceof Blob) {
    // Read blob as text to get error JSON
    return 'Erro ao gerar relatório. Verifique se há dados no período.';
  }
  return err.response?.data?.error || err.message || 'Erro ao gerar relatório';
}

const Relatorios: React.FC = () => {
  const { toast, ToastContainer } = useToast();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [topN, setTopN] = useState(20);
  const [generating, setGenerating] = useState<ReportKey | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const buildBody = useCallback((type: ReportKey): any => {
    const body: any = { type };
    if (startDate) body.startDate = startDate;
    if (endDate) body.endDate = endDate;
    if (type === 'top-products') body.topN = topN;
    return body;
  }, [startDate, endDate, topN]);

  const fetchPdfBlob = async (type: ReportKey): Promise<Blob> => {
    const res = await api.post('/reports/pdf', buildBody(type), { responseType: 'blob' });
    // Check if the response is actually an error (blob with JSON error)
    if (res.data?.type === 'application/json' || (res.data?.size && res.data.size < 200)) {
      const text = await res.data.text();
      try {
        const json = JSON.parse(text);
        if (json.error) throw new Error(json.error);
      } catch { /* not JSON, it's a real PDF */ }
    }
    return new Blob([res.data], { type: 'application/pdf' });
  };

  const handlePreview = async (type: ReportKey, title: string) => {
    setGenerating(type);
    try {
      const blob = await fetchPdfBlob(type);
      const url = window.URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewTitle(title);
    } catch (err: any) {
      toast(extractError(err), 'error');
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = async (type: ReportKey) => {
    setGenerating(type);
    try {
      const blob = await fetchPdfBlob(type);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-${type}-${Date.now()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast('Relatório baixado!', 'success');
    } catch (err: any) {
      toast(extractError(err), 'error');
    } finally {
      setGenerating(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewTitle('');
  };

  const setQuickPeriod = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <AuthGuard>
      <DefaultPage title="Relatórios Gerenciais">
        <Head><title>Relatórios - Admin - Xananas&apos; Garden</title></Head>
        <ToastContainer />
        <div className="min-h-screen bg-gray-50">
          <AdminHeader />
          <div className="flex flex-col lg:flex-row">
            <AdminSidebar />
            <div className="flex-1 p-4 md:p-6 min-w-0 pb-20 lg:pb-6">

              {/* Period filter */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar size={20} className="text-[#de818d]" />
                  <h2 className="font-semibold text-gray-800">Filtro de Período</h2>
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Data inicial</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                      className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#de818d]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Data final</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                      className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#de818d]" />
                  </div>
                  <div className="flex gap-1">
                    {[{ label: '7 dias', days: 7 }, { label: '30 dias', days: 30 }, { label: '90 dias', days: 90 }, { label: 'Ano', days: 365 }].map(p => (
                      <button key={p.days} onClick={() => setQuickPeriod(p.days)}
                        className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                        {p.label}
                      </button>
                    ))}
                    <button onClick={() => { setStartDate(''); setEndDate(''); }}
                      className="px-3 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors">
                      Limpar
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Top N</label>
                    <select value={topN} onChange={e => setTopN(Number(e.target.value))}
                      className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#de818d]">
                      {[10, 20, 30, 50].map(n => <option key={n} value={n}>Top {n}</option>)}
                    </select>
                  </div>
                </div>
                {(startDate || endDate) && (
                  <p className="text-xs text-gray-400 mt-3">Período: {startDate || 'Início'} → {endDate || 'Atual'}</p>
                )}
              </div>

              {/* Report cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORTS.map(report => {
                  const Icon = report.icon;
                  const isGenerating = generating === report.key;
                  return (
                    <div key={report.key} className={`${report.bg} ${report.border} border rounded-xl p-5 transition-all`}>
                      <div className="flex items-start justify-between mb-3">
                        <Icon size={28} className={report.color} />
                        {isGenerating && <AnimatedLogo size={20} />}
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">{report.title}</h3>
                      <p className="text-xs text-gray-500 mb-4">{report.description}</p>
                      <div className="flex gap-2">
                        <button onClick={() => handlePreview(report.key, report.title)} disabled={isGenerating}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg py-2 hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50">
                          <Eye size={14} /> Visualizar
                        </button>
                        <button onClick={() => handleDownload(report.key)} disabled={isGenerating}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg py-2 hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50">
                          <Download size={14} /> Baixar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* PDF Preview Modal */}
        {previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closePreview} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <FilePdf size={20} className="text-red-500" />
                  <h3 className="font-semibold text-gray-800">{previewTitle}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a href={previewUrl} download={`relatorio-${previewTitle}.pdf`}
                    className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                    <Download size={14} /> Baixar
                  </a>
                  <button onClick={() => { window.print(); }}
                    className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                    <Printer size={14} /> Imprimir
                  </button>
                  <button onClick={closePreview}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <iframe src={previewUrl} className="flex-1 w-full border-0" title="Preview do relatório" />
            </div>
          </div>
        )}
      </DefaultPage>
    </AuthGuard>
  );
};

export default Relatorios;
