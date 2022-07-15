import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/google/callback';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID in .env' });
  }

  // mode: 'login' (default) or 'link'
  // userId: required when mode=link
  const mode = (req.query.mode as string) || 'login';
  const userId = req.query.userId as string;

  if (mode === 'link' && !userId) {
    return res.status(400).json({ error: 'userId is required for link mode' });
  }

  // Build state: "login_<random>" or "link_<userId>_<random>"
  const random = crypto.randomBytes(16).toString('hex');
  const state = mode === 'link' ? `link_${userId}_${random}` : `login_${random}`;

  // Store state in a cookie for CSRF verification
  res.setHeader('Set-Cookie', [
    `google_oauth_state=${state}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax`,
  ]);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // If accessed via fetch (application/json), return the URL
  if (req.headers.accept?.includes('application/json')) {
    return res.status(200).json({ url: googleAuthUrl });
  }

  // Direct redirect
  res.redirect(googleAuthUrl);
}
