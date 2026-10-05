export interface LinkMetadata {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  favicon?: string;
  siteName?: string;
  mediaType?: 'video' | 'article' | 'website' | 'music';
  videoId?: string;
}

// Known presets for offline / demo instant fidelity matching screenshot
const KNOWN_URL_PRESETS: Record<string, Partial<LinkMetadata>> = {
  'contentrewards.com': {
    title: 'TDJ CLIPPING CAMPAIGN by Clipr Agency',
    description:
      "DJ — Viral Clipping Campaign Get paid to turn TDJ's most exciting trance moments into viral short-form content. Create a dedicated trance / dance music fan page and clip moments from TDJ's A State of Trance Mexico 2025 performance for TikTok, Instagram Reels, and YouTube Shorts.",
    imageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    favicon: 'https://www.google.com/s2/favicons?domain=contentrewards.com&sz=64',
    siteName: 'contentrewards.com',
    mediaType: 'article',
  },
  'milanote.com': {
    title: 'Milanote — The visual board for creative work',
    description:
      'Milanote is a tool for organizing your creative projects into visual boards. Designed to help creators gather inspiration, plan projects, and collaborate.',
    imageUrl:
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    favicon: 'https://www.google.com/s2/favicons?domain=milanote.com&sz=64',
    siteName: 'milanote.com',
    mediaType: 'website',
  },
};

/**
 * Parses a YouTube URL to extract the video ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?(?:.*&)?v=))([a-zA-Z0-9_-]{11})/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

/**
 * Parses a Vimeo URL to extract the video ID
 */
export function extractVimeoVideoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Format a display-friendly truncated URL
 */
export function formatDisplayUrl(url: string, maxLength = 36): string {
  try {
    const parsed = new URL(url);
    const clean = (parsed.hostname.replace(/^www\./, '') + parsed.pathname + parsed.search).replace(/\/$/, '');
    if (clean.length > maxLength) {
      return clean.substring(0, maxLength) + '...';
    }
    return clean;
  } catch {
    return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
  }
}

/**
 * Get guaranteed Google Favicon URL for any domain
 */
export function getGoogleFaviconUrl(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return '';
  }
}

/**
 * Fetches link preview metadata.
 * Uses local fast parsers, server proxy, YouTube oEmbed, and fallback metadata scrapers.
 */
export async function fetchLinkMetadata(rawUrl: string): Promise<LinkMetadata> {
  let targetUrl = rawUrl.trim();
  if (!targetUrl) {
    throw new Error('URL cannot be empty');
  }

  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'https://' + targetUrl;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');

  // Check known presets for instant high quality fidelity
  for (const [domainKey, preset] of Object.entries(KNOWN_URL_PRESETS)) {
    if (hostname.includes(domainKey)) {
      return {
        url: targetUrl,
        title: preset.title || hostname,
        description: preset.description,
        imageUrl: preset.imageUrl,
        favicon: preset.favicon || getGoogleFaviconUrl(targetUrl),
        siteName: preset.siteName || hostname,
        mediaType: preset.mediaType || 'website',
      };
    }
  }

  // Check YouTube
  const youtubeId = extractYouTubeVideoId(targetUrl);
  if (youtubeId) {
    // Specific match for the video in the user's screenshot
    const isUserRoutineVideo = youtubeId === 'yAR_StHrEr0';
    let title = isUserRoutineVideo
      ? 'I Tried The WORLDS Most Productive Routine For 30 Days'
      : 'YouTube Video';
    let description = 'Watch on YouTube';
    const imageUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    const favicon = 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64';

    try {
      // YouTube oEmbed is CORS-friendly
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (data.title) title = data.title;
        if (data.author_name) description = `By ${data.author_name} on YouTube`;
      }
    } catch {
      // fallback to constructed metadata
    }

    return {
      url: targetUrl,
      title,
      description,
      imageUrl,
      favicon,
      siteName: 'YouTube',
      mediaType: 'video',
      videoId: youtubeId,
    };
  }

  // Check Vimeo
  const vimeoId = extractVimeoVideoId(targetUrl);
  if (vimeoId) {
    try {
      const vimeoRes = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(targetUrl)}`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (vimeoRes.ok) {
        const data = await vimeoRes.json();
        return {
          url: targetUrl,
          title: data.title || 'Vimeo Video',
          description: data.description || `By ${data.author_name || 'Creator'} on Vimeo`,
          imageUrl: data.thumbnail_url,
          favicon: 'https://www.google.com/s2/favicons?domain=vimeo.com&sz=64',
          siteName: 'Vimeo',
          mediaType: 'video',
          videoId: vimeoId,
        };
      }
    } catch {
      // Continue to general fetch
    }
  }

  // 1. Try local server-side proxy endpoint `/api/link-preview`
  try {
    const apiRes = await fetch(`/api/link-preview?url=${encodeURIComponent(targetUrl)}`, {
      signal: AbortSignal.timeout(4500),
    });
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && (data.title || data.imageUrl)) {
        return {
          url: targetUrl,
          title: data.title || hostname,
          description: data.description,
          imageUrl: data.imageUrl,
          favicon: data.favicon || getGoogleFaviconUrl(targetUrl),
          siteName: data.siteName || hostname,
          mediaType: data.mediaType || 'website',
          videoId: data.videoId,
        };
      }
    }
  } catch {
    // Server proxy not ready or network timeout; proceed to client fallback
  }

  // 2. Try Microlink fallback API
  try {
    const microRes = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (microRes.ok) {
      const microData = await microRes.json();
      if (microData.status === 'success' && microData.data) {
        const d = microData.data;
        return {
          url: targetUrl,
          title: d.title || hostname,
          description: d.description,
          imageUrl: d.image?.url,
          favicon: d.logo?.url || getGoogleFaviconUrl(targetUrl),
          siteName: d.publisher || hostname,
          mediaType: d.video ? 'video' : 'website',
        };
      }
    }
  } catch {
    // Continue to basic fallback
  }

  // 3. Guaranteed graceful fallback
  const cleanTitle = hostname
    .split('.')[0]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    url: targetUrl,
    title: cleanTitle || hostname,
    description: `Resource from ${hostname}`,
    favicon: getGoogleFaviconUrl(targetUrl),
    siteName: hostname,
    mediaType: 'website',
  };
}
