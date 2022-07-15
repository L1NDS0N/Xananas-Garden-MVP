import { MagnifyingGlass, List, X, ShoppingCart, Gear, Clock, ArrowUpRight } from 'phosphor-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import LogoRose from '../../assets/LogoRose';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';

const RECENT_KEY = 'xananas_recent_searches';
const MAX_RECENT = 5;

interface HeaderProps {
  onSearch?: (term: string) => void;
  onToggleFilters?: () => void;
  filtersOpen?: boolean;
  onCartClick?: () => void;
  products?: { name: string; slug: string; category?: { name: string } }[];
}

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch { return []; }
}

function saveRecentSearch(term: string) {
  const recent = getRecentSearches().filter(r => r !== term);
  recent.unshift(term);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY);
}

const Header: React.FC<HeaderProps> = ({ onSearch, onToggleFilters, filtersOpen, onCartClick, products = [] }) => {
  const { itemCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const clickTimesRef = React.useRef<number[]>([]);
  const navTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, [searchFocused]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    clickTimesRef.current.push(now);
    clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 2000);
    if (clickTimesRef.current.length >= 7) {
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
      clickTimesRef.current = [];
      window.location.href = '/admin/login';
      return;
    }
    if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
    navTimeoutRef.current = setTimeout(() => { window.location.href = '/'; }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm.trim());
      setRecentSearches(getRecentSearches());
    }
    onSearch?.(searchTerm);
    setSearchFocused(false);
    inputRef.current?.blur();
  };

  const handleSelectRecent = (term: string) => {
    setSearchTerm(term);
    onSearch?.(term);
    setSearchFocused(false);
  };

  const handleSelectProduct = (slug: string) => {
    window.location.href = `/catalogo/${slug}`;
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch?.('');
  };

  const clearAllRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // Filter product suggestions
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(term) || p.category?.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [searchTerm, products]);

  const showDropdown = searchFocused && (recentSearches.length > 0 || suggestions.length > 0);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      {/* Mobile: simple flex row (search grows to fill, cart pinned at the end).
          sm+: 3 equal columns so the search bar sits truly centered on the page, cart pinned to the right corner. */}
      <div className="flex sm:grid sm:grid-cols-3 items-center gap-2 h-14 px-2 sm:px-3 md:px-6">
        {/* Left: filter toggle + logo */}
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onToggleFilters}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0" title="Filtros">
            {filtersOpen ? <X size={20} className="text-gray-600" /> : <List size={20} className="text-gray-600" />}
          </button>

          <Link href="/" onClick={handleLogoClick} className="flex items-center gap-1.5 flex-shrink-0 select-none">
            <LogoRose width={30} height={30} />
            <span className="hidden sm:block font-gloria text-[#de818d] text-lg leading-none whitespace-nowrap">
              Xananas&apos; Garden
            </span>
          </Link>

          <div className="hidden sm:block w-px h-6 bg-gray-200 flex-shrink-0" />
        </div>

        {/* Center: search bar with autocomplete — kept centered on the page regardless of side widths */}
        <div className="flex-1 sm:flex-none sm:w-full sm:max-w-lg sm:mx-auto min-w-0 relative" ref={dropdownRef}>
          <form onSubmit={handleSearch}>
            <div className={`flex items-center h-9 rounded-lg border transition-colors ${
              searchFocused ? 'border-[#de818d] bg-white ring-1 ring-[#de818d]/20' : 'border-gray-200 bg-gray-50'
            }`}>
              <MagnifyingGlass size={16} className="ml-2 sm:ml-3 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleChange}
                onFocus={() => setSearchFocused(true)}
                className="w-full px-1 sm:px-2 text-sm bg-transparent outline-none min-w-0"
                placeholder="Buscar produto..."
              />
              {searchTerm && (
                <button type="button" onClick={clearSearch} className="mr-2 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Autocomplete dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
              {/* Recent searches */}
              {recentSearches.length > 0 && !searchTerm && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Buscas recentes</span>
                    <button onClick={clearAllRecent} className="text-[10px] text-gray-400 hover:text-red-500">Limpar</button>
                  </div>
                  {recentSearches.map((term, i) => (
                    <button key={i} onClick={() => handleSelectRecent(term)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left">
                      <Clock size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Product suggestions */}
              {suggestions.length > 0 && (
                <div className="p-2 border-t border-gray-100">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-2 py-1 block">Produtos</span>
                  {suggestions.map((p, i) => (
                    <button key={i} onClick={() => handleSelectProduct(p.slug)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors text-left">
                      <div>
                        <p className="text-gray-800 font-medium">{p.name}</p>
                        {p.category && <p className="text-[10px] text-gray-400">{p.category.name}</p>}
                      </div>
                      <ArrowUpRight size={14} className="text-gray-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: admin + cart, anchored to the corner */}
        <div className="flex items-center justify-end gap-1 flex-shrink-0">
          {isAuthenticated && user?.admin && (
            <Link href="/admin/dashboard"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-[#de818d] hover:bg-pink-50 transition-colors">
              <Gear size={18} />
            </Link>
          )}
          {onCartClick && (
            <button onClick={onCartClick}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              title="Carrinho">
              <ShoppingCart size={20} className="text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#de818d] text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center leading-none">
                  {itemCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
