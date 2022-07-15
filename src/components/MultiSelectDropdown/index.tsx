import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, Check, X } from 'phosphor-react';

export interface MultiSelectOption {
  id: string;
  label: string;
  hint?: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  error?: boolean;
}

/** Generic multiselect dropdown: a single trigger button showing chips for what's picked,
 * opening a checkbox list on click. Used wherever a field can take more than one value
 * (categories, formas de pagamento) without needing a separate "extras" UI section. */
const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedIds, onChange, placeholder = 'Selecione...', error }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selected = options.filter(o => selectedIds.includes(o.id));

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(prev => !prev)}
        className={`w-full min-h-[42px] px-3 py-1.5 border rounded-lg text-sm flex items-center justify-between gap-2 flex-wrap focus:outline-none focus:ring-2 focus:ring-[#de818d] ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
        <div className="flex-1 flex flex-wrap gap-1 items-center">
          {selected.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selected.map(o => (
              <span key={o.id} className="flex items-center gap-1 bg-pink-50 text-[#de818d] text-xs font-medium pl-2 pr-1 py-0.5 rounded-full">
                {o.label}
                <span onClick={e => { e.stopPropagation(); toggle(o.id); }} className="hover:bg-[#de818d]/20 rounded-full p-0.5">
                  <X size={10} />
                </span>
              </span>
            ))
          )}
        </div>
        <CaretDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {options.length === 0 ? (
            <p className="p-3 text-xs text-gray-400 text-center">Nenhuma opção disponível</p>
          ) : (
            options.map(o => {
              const checked = selectedIds.includes(o.id);
              return (
                <button key={o.id} type="button" onClick={() => toggle(o.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-pink-50 transition-colors">
                  <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border ${checked ? 'bg-[#de818d] border-[#de818d]' : 'border-gray-300'}`}>
                    {checked && <Check size={11} weight="bold" className="text-white" />}
                  </span>
                  <span className="flex-1 text-gray-700">{o.label}</span>
                  {o.hint && <span className="text-xs text-gray-400">{o.hint}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
