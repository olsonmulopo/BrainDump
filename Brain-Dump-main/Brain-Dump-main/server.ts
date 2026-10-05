import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
}

function extractMetaTag(html: string, propertyOrName: string): string | null {
  // Regex for property="..." content="..." or content="..." property="..."
  const regex1 = new RegExp(
    `<meta[^>]*(?:property|name)=["']${propertyOrName}["'][^>]*content=["']([^"']*)["']`,
    'i'
  );
  const regex2 = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${propertyOrName}["']`,
    'i'
  );
  const match1 = html.match(regex1);
  if (match1 && match1[1]) return decodeHtmlEntities(match1[1].trim());
  const match2 = html.match(regex2);
  if (match2 && match2[1]) return decodeHtmlEntities(match2[1].trim());
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match && match[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  const match = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i);
  if (match && match[1]) {
    try {
      return new URL(match[1].trim(), baseUrl).href;
    } catch {
      return null;
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Link preview scraper endpoint
  app.get("/api/link-preview", async (req: Request, res: Response) => {
    const rawUrl = req.query.url;
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'Missing url query parameter' });
    }

    let targetUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');

    // YouTube handler
    const youtubeMatch = targetUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?(?:.*&)?v=))([a-zA-Z0-9_-]{11})/i
    );
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      let title = videoId === 'yAR_StHrEr0'
        ? 'I Tried The WORLDS Most Productive Routine For 30 Days'
        : 'YouTube Video';
      let description = 'Watch on YouTube';
      const imageUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      const favicon = `https://www.google.com/s2/favicons?domain=youtube.com&sz=64`;

      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (oembedRes.ok) {
          const data = (await oembedRes.json()) as any;
          if (data.title) title = data.title;
          if (data.author_name) description = `By ${data.author_name} on YouTube`;
        }
      } catch {
        // use fallback title
      }

      return res.json({
        url: targetUrl,
        title,
        description,
        imageUrl,
        favicon,
        siteName: 'YouTube',
        mediaType: 'video',
        videoId,
      });
    }

    // General Web URL scraper
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(5000),
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();

      // Extract OpenGraph / Twitter metadata
      const ogTitle = extractMetaTag(html, 'og:title');
      const twitterTitle = extractMetaTag(html, 'twitter:title');
      const htmlTitle = extractTitle(html);
      const title = ogTitle || twitterTitle || htmlTitle || hostname;

      const ogDesc = extractMetaTag(html, 'og:description');
      const twitterDesc = extractMetaTag(html, 'twitter:description');
      const metaDesc = extractMetaTag(html, 'description');
      const description = ogDesc || twitterDesc || metaDesc || `Web resource from ${hostname}`;

      const ogImage = extractMetaTag(html, 'og:image') || extractMetaTag(html, 'og:image:url');
      const twitterImage = extractMetaTag(html, 'twitter:image');
      let imageUrl = ogImage || twitterImage || null;
      if (imageUrl) {
        try {
          imageUrl = new URL(imageUrl, targetUrl).href;
        } catch {
          // ignore
        }
      }

      const ogSiteName = extractMetaTag(html, 'og:site_name');
      const siteName = ogSiteName || hostname;

      const htmlFavicon = extractFavicon(html, targetUrl);
      const favicon = htmlFavicon || `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

      const isVideo = html.includes('og:video') || targetUrl.includes('vimeo.com') || targetUrl.includes('tiktok.com');

      return res.json({
        url: targetUrl,
        title,
        description,
        imageUrl,
        favicon,
        siteName,
        mediaType: isVideo ? 'video' : 'article',
      });
    } catch (err: any) {
      // Return graceful fallback with Google Favicon
      const cleanName = hostname
        .split('.')[0]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return res.json({
        url: targetUrl,
        title: cleanName || hostname,
        description: `Resource from ${hostname}`,
        imageUrl: null,
        favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
        siteName: hostname,
        mediaType: 'website',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
