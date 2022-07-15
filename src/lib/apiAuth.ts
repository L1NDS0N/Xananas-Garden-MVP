import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { hasActionAccess } from './permissions';

const JWT_SECRET = process.env.JWT_SECRET || 'xananas-garden-secret';

export interface AuthUser {
  id: string;
  admin?: boolean;
  role?: string;
  [key: string]: any;
}

export function getUserFromRequest(req: NextApiRequest): AuthUser | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const user = jwt.verify(auth.slice(7), JWT_SECRET) as AuthUser;
    // Tokens issued before the `role` claim existed (or without it for any other reason)
    // must fall back the same way the client does (see useAuth.ts decodeUserFromToken),
    // otherwise server-side permission checks silently reject users the UI shows as logged in.
    if (!user.role) user.role = user.admin ? 'admin' : 'viewer';
    return user;
  } catch { return null; }
}

/** Requires a logged-in user. Writes 401 and returns null if not authenticated. */
export function requireAuth(req: NextApiRequest, res: NextApiResponse): AuthUser | null {
  const user = getUserFromRequest(req);
  if (!user) { res.status(401).json({ error: 'Não autenticado' }); return null; }
  return user;
}

/** Requires a logged-in user with at least the given entity/action permission (see src/lib/permissions.ts). */
export function requirePermission(req: NextApiRequest, res: NextApiResponse, entity: string, action: string): AuthUser | null {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (!hasActionAccess(user.role, entity, action)) {
    res.status(403).json({ error: 'Permissão insuficiente' });
    return null;
  }
  return user;
}
