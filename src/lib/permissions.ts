/**
 * Role-Based Access Control (RBAC)
 *
 * Roles (from most to least access):
 * - admin: Full access to everything
 * - manager: Can manage products, categories, campaigns, coupons, clients, suppliers, purchases, reports, stock
 * - cashier: Can use PDV, view products, manage stock entries/exits
 * - viewer: Read-only access to dashboard and reports
 */

export type Role = 'admin' | 'manager' | 'cashier' | 'viewer';

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  cashier: 'Caixa',
  viewer: 'Visualizador',
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 4,
  manager: 3,
  cashier: 2,
  viewer: 1,
};

// Page access permissions
export const PAGE_PERMISSIONS: Record<string, Role[]> = {
  '/admin/dashboard': ['admin', 'manager', 'cashier', 'viewer'],
  '/admin/dashboard/pdv': ['admin', 'manager', 'cashier'],
  '/admin/dashboard/produtos': ['admin', 'manager'],
  '/admin/dashboard/estoque': ['admin', 'manager', 'cashier'],
  '/admin/dashboard/compras': ['admin', 'manager'],
  '/admin/dashboard/fornecedores': ['admin', 'manager'],
  '/admin/dashboard/categorias': ['admin', 'manager'],
  '/admin/dashboard/campanhas': ['admin', 'manager'],
  '/admin/dashboard/cupons': ['admin', 'manager'],
  '/admin/dashboard/clientes': ['admin', 'manager', 'cashier'],
  '/admin/dashboard/solicitacoes': ['admin', 'manager', 'cashier'],
  '/admin/dashboard/relatorios': ['admin', 'manager', 'viewer'],
  '/admin/dashboard/usuarios': ['admin'],
  '/admin/dashboard/auditoria': ['admin'],
  '/admin/dashboard/configuracoes': ['admin'],
  '/admin/dashboard/formas-pagamento': ['admin'],
  '/admin/dashboard/perfil': ['admin', 'manager', 'cashier', 'viewer'],
};

// Action permissions
export const ACTION_PERMISSIONS = {
  product: {
    create: ['admin', 'manager'],
    edit: ['admin', 'manager'],
    delete: ['admin'],
    toggleStatus: ['admin', 'manager'],
  },
  category: {
    create: ['admin', 'manager'],
    edit: ['admin', 'manager'],
    delete: ['admin'],
  },
  sale: {
    create: ['admin', 'manager', 'cashier'],
    view: ['admin', 'manager', 'cashier'],
    refund: ['admin', 'manager'],
  },
  stock: {
    adjust: ['admin', 'manager', 'cashier'],
    view: ['admin', 'manager', 'cashier'],
  },
  user: {
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin'],
    viewRole: ['admin'],
  },
  report: {
    view: ['admin', 'manager', 'viewer'],
    export: ['admin', 'manager'],
  },
  coupon: {
    create: ['admin', 'manager'],
    edit: ['admin', 'manager'],
    delete: ['admin'],
  },
  campaign: {
    create: ['admin', 'manager'],
    edit: ['admin', 'manager'],
    delete: ['admin'],
  },
  supplier: {
    create: ['admin', 'manager'],
    edit: ['admin', 'manager'],
    delete: ['admin'],
  },
  purchase: {
    create: ['admin', 'manager'],
    edit: ['admin', 'manager'],
    delete: ['admin'],
  },
  cashflow: {
    view: ['admin', 'manager', 'cashier'],
    closing: ['admin', 'manager'],
  },
  settings: {
    edit: ['admin'],
  },
  paymentMethod: {
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin'],
  },
  audit: {
    view: ['admin'],
  },
};

export function hasPageAccess(role: string | undefined, path: string): boolean {
  // Fallback: if no role, allow based on admin field (backward compat)
  if (!role) return true; // default allow if role not set (legacy users)
  const allowed = PAGE_PERMISSIONS[path];
  if (!allowed) return true; // default allow if page not in list
  return allowed.includes(role as Role);
}

export function hasActionAccess(role: string | undefined, entity: string, action: string): boolean {
  if (!role) return false;
  const permissions = ACTION_PERMISSIONS[entity as keyof typeof ACTION_PERMISSIONS];
  if (!permissions) return true;
  const allowed = permissions[action as keyof typeof permissions];
  if (!allowed) return true;
  return (allowed as string[]).includes(role);
}

export function isAtLeast(role: string | undefined, minRole: Role): boolean {
  if (!role) return false;
  return (ROLE_HIERARCHY[role as Role] || 0) >= ROLE_HIERARCHY[minRole];
}
