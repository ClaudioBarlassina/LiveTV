import { getChannelsFromServer } from '../services/subscription';

const IS_WEB = typeof window !== 'undefined' && !!window.document;
export const PROXY_BASE = 'https://dashtv.onrender.com';

export function isYoutubeUrl(url) {
  if (!url) return false;
  return url.includes('youtube.com/watch') || url.includes('youtu.be/');
}

export function getYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export function extractDirectUrl(proxiedUrl) {
  if (!proxiedUrl || !proxiedUrl.includes(PROXY_BASE + '/proxy/video')) return null;
  try {
    return new URL(proxiedUrl).searchParams.get('url') || null;
  } catch {
    return null;
  }
}

function proxyUrl(url, noProxy) {
  if (!url || !IS_WEB || noProxy || isYoutubeUrl(url)) return url;
  return `${PROXY_BASE}/proxy/video?url=${encodeURIComponent(url)}`;
}

const DEFAULTS = [
  { id: 'telefe', name: 'Telefe', country: 'Argentina', logo: null, streamUrl: null, note: 'Disponible durante el Mundial' },
  { id: 'dsports', name: 'DSports', country: 'Argentina', logo: null, streamUrl: null, note: 'Deportes en vivo' },
  { id: 'espn', name: 'ESPN', country: 'Argentina', logo: null, streamUrl: null, note: 'Disponible durante el Mundial' },
  { id: 'tycsports', name: 'TyC Sports', country: 'Argentina', logo: null, streamUrl: null, note: 'Disponible durante el Mundial' },
];

export const CHANNELS = [...DEFAULTS];

let _loaded = false;

export async function loadChannels(force = false) {
  if (_loaded && !force) return;
  _loaded = false;
  try {
    const server = await getChannelsFromServer();
    if (server && server.length > 0) {
      CHANNELS.length = 0;
      CHANNELS.push(...server.map((ch) => ({
        ...ch,
        streamUrl: proxyUrl(ch.streamUrl, ch.noProxy),
      })));
    }
  } catch {}
  _loaded = true;
}


