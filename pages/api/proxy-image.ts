import type { NextApiRequest, NextApiResponse } from 'next';
import { requireUser } from '@/lib/requireUser';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const ALLOWED_OPENAI_HOSTS = new Set([
  'oaidalleapiprodscus.blob.core.windows.net',
  'files.oaiusercontent.com',
]);

function getAllowedHosts(): Set<string> {
  const hosts = new Set(ALLOWED_OPENAI_HOSTS);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      hosts.add(new URL(supabaseUrl).hostname.toLowerCase());
    } catch {
      // Ignore malformed env values; fail closed on host checks.
    }
  }

  return hosts;
}

function isAllowedImageUrl(rawUrl: string, allowedHosts: Set<string>): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local')) return false;
  if (hostname === '::1' || hostname.includes(':')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;

  return allowedHosts.has(hostname);
}

function isImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const type = contentType.split(';')[0].trim().toLowerCase();
  return type.startsWith('image/');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireUser(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing image URL' });
  }

  const allowedHosts = getAllowedHosts();
  let currentUrl = url;

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!isAllowedImageUrl(currentUrl, allowedHosts)) {
        return res.status(400).json({ error: 'Image host is not allowed' });
      }

      const imageResponse = await fetch(currentUrl, {
        redirect: 'manual',
        headers: { Accept: 'image/*' },
      });

      if (imageResponse.status >= 300 && imageResponse.status < 400) {
        const location = imageResponse.headers.get('location');
        if (!location) {
          return res.status(502).json({ error: 'Invalid image redirect' });
        }
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!imageResponse.ok) {
        return res.status(502).json({ error: `Failed to fetch image: ${imageResponse.statusText}` });
      }

      if (!isImageContentType(imageResponse.headers.get('content-type'))) {
        return res.status(400).json({ error: 'URL did not return an image' });
      }

      const contentLength = imageResponse.headers.get('content-length');
      if (contentLength && Number(contentLength) > MAX_IMAGE_BYTES) {
        return res.status(413).json({ error: 'Image is too large' });
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
        return res.status(413).json({ error: 'Image is too large' });
      }

      res.setHeader(
        'Content-Type',
        imageResponse.headers.get('content-type') || 'image/png',
      );
      return res.status(200).send(Buffer.from(arrayBuffer));
    }

    return res.status(400).json({ error: 'Too many redirects' });
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Proxy failed' });
  }
}
