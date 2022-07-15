import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'xananas-garden-secret';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

async function exchangeCode(code: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  if (!response.ok) throw new Error(`Token exchange failed: ${await response.text()}`);
  return response.json();
}

async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Failed to fetch user info from Google');
  return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { code, state, error } = req.query;

    if (error) return res.redirect(`/admin/login?error=google_denied`);
    if (!code || typeof code !== 'string') return res.redirect(`/admin/login?error=no_code`);

    // Parse state: can be "login_<random>" or "link_<userId>_<random>"
    const stateStr = typeof state === 'string' ? state : '';
    const isLinkMode = stateStr.startsWith('link_');
    const linkUserId = isLinkMode ? stateStr.replace('link_', '').split('_')[0] : null;

    // Exchange authorization code for tokens
    const tokenData = await exchangeCode(code);
    const googleUser = await getUserInfo(tokenData.access_token);

    if (!googleUser.email) return res.redirect(`/admin/login?error=no_email`);

    if (isLinkMode && linkUserId) {
      // === LINK MODE: Link a Google account to the logged-in user ===
      const user = await prisma.user.findUnique({ where: { id: linkUserId } });
      if (!user) return res.redirect(`/admin/perfil?error=user_not_found`);

      // Check if this Google account is already linked to another user
      const existingLink = await prisma.userGoogleAccount.findFirst({
        where: { googleId: googleUser.id, userId: { not: linkUserId } },
      });
      if (existingLink) return res.redirect(`/admin/dashboard/perfil?error=google_linked_to_other`);

      // Upsert the Google account link
      const firstAccount = await prisma.userGoogleAccount.count({ where: { userId: linkUserId } }) === 0;
      await prisma.userGoogleAccount.upsert({
        where: { userId_googleId: { userId: linkUserId, googleId: googleUser.id } },
        create: {
          userId: linkUserId,
          googleId: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
          isPrimary: firstAccount,
        },
        update: {
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.picture,
        },
      });

      // If this is the first linked account, also update the user's avatar
      if (firstAccount && !user.avatar) {
        await prisma.user.update({
          where: { id: linkUserId },
          data: { avatar: googleUser.picture, googleId: googleUser.id },
        });
      }

      // Return HTML that closes popup and signals success
      const html = `<!DOCTYPE html><html><body>
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
          <p>Conta Google vinculada! Pode fechar esta janela.</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage('GOOGLE_LINK_SUCCESS', '*');
            window.close();
          } else {
            window.location.href = '/admin/dashboard/perfil';
          }
        </script>
      </body></html>`;
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);

    } else {
      // === LOGIN MODE: Find existing user by Google account or email ===
      // First try to find by linked Google account
      let googleAccount = await prisma.userGoogleAccount.findFirst({
        where: { googleId: googleUser.id },
      });

      let user = googleAccount
        ? await prisma.user.findUnique({ where: { id: googleAccount.userId } })
        : null;

      // Fallback: find by email
      if (!user) {
        user = await prisma.user.findFirst({ where: { email: googleUser.email } });
      }

      if (!user) {
        return res.redirect(`/admin/login?error=no_account&email=${encodeURIComponent(googleUser.email)}`);
      }

      // Auto-link if not already linked
      if (!googleAccount) {
        const firstAccount = await prisma.userGoogleAccount.count({ where: { userId: user.id } }) === 0;
        await prisma.userGoogleAccount.create({
          data: {
            userId: user.id,
            googleId: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            avatar: googleUser.picture,
            isPrimary: firstAccount,
          },
        });
        if (firstAccount && !user.avatar) {
          await prisma.user.update({
            where: { id: user.id },
            data: { avatar: googleUser.picture, googleId: googleUser.id },
          });
        }
      }

      // Generate JWT
      const role = (user as any).role || (user.admin ? 'admin' : 'viewer');
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          admin: user.admin,
          role,
          phone: user.phone,
          whatsapp: user.whatsapp,
          avatar: user.avatar,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const html = `<!DOCTYPE html><html><body>
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
          <p>Processando login...</p>
        </div>
        <script>
          (function() {
            var token = ${JSON.stringify(token)};
            localStorage.setItem('xananas_auth_token', token);
            if (window.opener) {
              window.opener.postMessage('LOGIN_SUCCESS', '*');
              window.close();
            } else {
              window.location.href = '/catalogo';
            }
          })();
        </script>
      </body></html>`;
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return res.redirect(`/admin/login?error=auth_failed`);
  }
}
