import { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * ETag middleware wrapper for Next.js API routes.
 * Returns 304 Not Modified if the client's If-None-Match matches.
 * 
 * Usage:
 *   export default withETag(async (req, res) => { ... });
 */
export function withETag(handler: Handler, maxAge = 60): Handler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Only apply ETag to GET requests
    if (req.method !== 'GET') {
      return handler(req, res);
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    let responseBody: any;
    let handlerSent = false;

    // Intercept json to capture the response (but don't send yet)
    res.json = (body: any) => {
      responseBody = body;
      handlerSent = true;
      return res;
    };

    // Execute the handler
    await handler(req, res);

    // If response already sent by the handler (e.g., error), skip ETag
    if (res.headersSent) {
      // Restore original json for any future calls
      res.json = originalJson;
      return;
    }

    // If no body was captured, nothing to do
    if (!handlerSent || responseBody === undefined) {
      res.json = originalJson;
      return;
    }

    // Generate ETag from response body
    const bodyStr = JSON.stringify(responseBody);
    const etag = `"${createHash('md5').update(bodyStr).digest('hex')}"`;

    // Set Cache-Control header
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, must-revalidate`);
    res.setHeader('ETag', etag);

    // Check If-None-Match
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === etag) {
      res.status(304).end();
      return;
    }

    // Restore original json BEFORE sending to avoid infinite loop
    res.json = originalJson;

    // Send the full response
    res.status(200).json(responseBody);
  };
}
