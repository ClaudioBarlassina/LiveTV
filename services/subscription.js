import { Platform } from 'react-native';

const IS_WEB = typeof window !== 'undefined' && !!window.document;

// En web usa el hostname dinámico (anda local y en Render)
// En native apunta al server deployado — cambiá RENDER_URL cuando deployes
const PROXY_PORT = 4000;
const RENDER_URL = 'http://192.168.120.107:4000'; // ⚠ Reemplazar por https://dashtv.onrender.com al deployar
const API_BASE = IS_WEB
  ? `http://${window.location.hostname}:${PROXY_PORT}`
  : RENDER_URL;

function getDeviceId() {
  try {
    const stored = localStorage?.getItem('dash_device_id');
    if (stored) return stored;
    const id = 'tv_' + Math.random().toString(36).slice(2, 10);
    localStorage?.setItem('dash_device_id', id);
    return id;
  } catch {
    return 'tv_' + Math.random().toString(36).slice(2, 10);
  }
}

let _deviceId = getDeviceId();

export function getChannelsFromServer() {
  return fetch(`${API_BASE}/api/channels`)
    .then((r) => r.json())
    .catch(() => []);
}

export function getSubscription() {
  try {
    const raw = localStorage?.getItem('dash_subscription');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSubscription(data) {
  try {
    localStorage?.setItem('dash_subscription', JSON.stringify(data));
  } catch {}
}

export function clearSubscription() {
  try {
    localStorage?.removeItem('dash_subscription');
  } catch {}
}

export async function checkSubscription() {
  try {
    const res = await fetch(
      `${API_BASE}/api/subscriptions/verify?deviceId=${encodeURIComponent(_deviceId)}`
    );
    const data = await res.json();
    if (data.valid) {
      saveSubscription(data);
      return { valid: true, channels: data.channels || [], expiresAt: data.expiresAt };
    }
    clearSubscription();
    return { valid: false, channels: data.channels || [] };
  } catch {
    const cached = getSubscription();
    if (cached) return { valid: true, ...cached };
    return { valid: false, channels: [] };
  }
}

export async function activateCode(code) {
  const res = await fetch(`${API_BASE}/api/subscriptions/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      deviceId: _deviceId,
      deviceName: Platform.OS === 'web' ? 'Web' : Platform.OS,
    }),
  });
  const data = await res.json();
  if (data.success) {
    saveSubscription(data);
  }
  return data;
}
