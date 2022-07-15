import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { HouseLine, Package, FolderPlus, ArrowLeft, CurrencyCircleDollar, Users, Gear, FileText, UserCircle, ShoppingCart, Megaphone, Truck, Ticket, Shield, List, X, CreditCard } from 'phosphor-react';
import { useAuth } from '../../hooks/useAuth';
import { PAGE_PERMISSIONS, Role } from '../../lib/permissions';

const AdminSidebar: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const role = ((user as any)?.role || ((user as any)?.admin ? 'admin' : 'viewer')) as Role;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock body scroll while the mobile drawer overlay is open, so the page
  // underneath doesn't scroll behind the fixed sheet.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [drawerOpen]);

  const isActive = (path: string) => router.pathname === path;

  const allLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: HouseLine },
    { href: '/admin/dashboard/pdv', label: 'PDV', icon: CurrencyCircleDollar },
    { href: '/admin/dashboard/solicitacoes', label: 'Solicitações', icon: ShoppingCart },
    { href: '/admin/dashboard/produtos', label: 'Produtos', icon: Package },
    { href: '/admin/dashboard/estoque', label: 'Estoque', icon: Package },
    { href: '/admin/dashboard/compras', label: 'Compras', icon: ShoppingCart },
    { href: '/admin/dashboard/fornecedores', label: 'Fornecedores', icon: Truck },
    { href: '/admin/dashboard/categorias', label: 'Categorias', icon: FolderPlus },
    { href: '/admin/dashboard/campanhas', label: 'Campanhas', icon: Megaphone },
    { href: '/admin/dashboard/cupons', label: 'Cupons', icon: Ticket },
    { href: '/admin/dashboard/clientes', label: 'Clientes', icon: UserCircle },
    { href: '/admin/dashboard/relatorios', label: 'Relatórios', icon: FileText },
    { href: '/admin/dashboard/usuarios', label: 'Usuários', icon: Users },
    { href: '/admin/dashboard/auditoria', label: 'Auditoria', icon: Shield },
    { href: '/admin/dashboard/formas-pagamento', label: 'Formas de Pagamento', icon: CreditCard },
    { href: '/admin/dashboard/configuracoes', label: 'Configurações', icon: Gear },
  ];

  const links = allLinks.filter(link => {
    const allowed = PAGE_PERMISSIONS[link.href];
    if (!allowed) return true;
    if (!role) return true;
    return allowed.includes(role);
  });

  // Essential items for mobile bottom bar (most used)
  const essentialLinks = links.filter(l =>
    ['/admin/dashboard', '/admin/dashboard/pdv', '/admin/dashboard/produtos', '/admin/dashboard/clientes'].includes(l.href)
  );

  return (
    <>
      {/* Desktop: vertical sidebar */}
      <div className="hidden lg:flex flex-col h-[calc(100vh-56px)] w-56 bg-white border-r border-gray-200 pt-4 sticky top-14">
        <nav className="flex-1 px-3">
          <ul className="flex flex-col gap-1">
            {links.map(link => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'btn-glass-pink-solid' : 'text-gray-600 hover:bg-[#de818d]/5 hover:text-gray-800'
                    }`}>
                    <Icon size={18} />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        {role && (
          <div className="px-4 py-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {role === 'admin' ? '🛡️ Admin' : role === 'manager' ? '📋 Gerente' : role === 'cashier' ? '💰 Caixa' : '👁️ Visualizador'}
            </span>
          </div>
        )}
        <div className="p-3 border-t border-gray-200">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-500 hover:bg-[#de818d]/5 hover:text-gray-700 transition-colors">
            <ArrowLeft size={18} />
            Voltar à loja
          </Link>
        </div>
      </div>

      {/* Mobile: bottom bar with essentials + hamburger for full menu */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center h-14">
          {essentialLinks.map(link => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link key={link.href} href={link.href}
                className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors ${
                  active ? 'text-[#de818d]' : 'text-gray-500'
                }`}>
                <Icon size={18} />
                <span className="text-[9px] font-medium">{link.label}</span>
              </Link>
            );
          })}
          {/* Hamburger for full menu */}
          <button onClick={() => setDrawerOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors ${
              drawerOpen ? 'text-[#de818d]' : 'text-gray-500'
            }`}>
            <List size={18} />
            <span className="text-[9px] font-medium">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile drawer — full menu */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[75vh] overflow-y-auto shadow-xl animate-slideUp">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">Menu Completo</h3>
              <button onClick={() => setDrawerOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <nav className="p-3">
              {links.map(link => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link key={link.href} href={link.href} onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'btn-glass-pink-solid' : 'text-gray-600 hover:bg-[#de818d]/5'
                    }`}>
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}
              <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-500 hover:bg-gray-50 mt-2 border-t border-gray-100 pt-4">
                <ArrowLeft size={18} />
                Voltar à loja
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
