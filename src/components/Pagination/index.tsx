import React from 'react';
import { CaretLeft, CaretRight } from 'phosphor-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page, totalPages, totalItems, perPage, onPageChange, onPerPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>
          Mostrando <span className="font-medium text-gray-700">{startItem}-{endItem}</span> de{' '}
          <span className="font-medium text-gray-700">{totalItems}</span>
        </span>
        {onPerPageChange && (
          <select value={perPage} onChange={e => onPerPageChange(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#de818d]">
            {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}/pág</option>)}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <CaretLeft size={14} />
        </button>

        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-[#de818d] text-white shadow-sm'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {p}
            </button>
          )
        )}

        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <CaretRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
