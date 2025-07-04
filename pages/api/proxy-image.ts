import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing image URL' });
  }

  try {
    const imageResponse = await fetch(url);
    if (!imageResponse.ok) {
      return res.status(500).json({ error: `Failed to fetch image: ${imageResponse.statusText}` });
    }

    // Pass through headers
    res.setHeader('Content-Type', imageResponse.headers.get('content-type') || 'image/png');

    // Stream image to client
    const arrayBuffer = await imageResponse.arrayBuffer();
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed' });
  }
}
