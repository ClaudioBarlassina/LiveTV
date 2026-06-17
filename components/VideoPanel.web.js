import { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, useWindowDimensions } from 'react-native';
import { CHANNELS, extractDirectUrl, isYoutubeUrl, getYoutubeId } from '../constants/channels';
import { COLORS } from '../constants/theme';

async function loadHls() {
  if (typeof window !== 'undefined' && window.Hls) return window.Hls;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    s.onload = () => resolve(window.Hls);
    s.onerror = () => reject(new Error('Failed to load hls.js'));
    document.head.appendChild(s);
  });
}

function getStatusFromVideo(video) {
  if (!video) return 'idle';
  if (video.readyState === 0) return 'loading';
  if (video.paused && video.readyState > 0) return 'idle';
  if (video.readyState >= 3) return 'playing';
  if (video.error) return 'error';
  return 'loading';
}

export default function VideoPanel({ match, channelId, onChannelChange, onFocus, focused, muted = true }) {
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 500;
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const wrapRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [hlsReady, setHlsReady] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimer = useRef(null);
  const dropdownRef = useRef(null);

  const channel = CHANNELS.find((c) => c.id === channelId) || CHANNELS[0];
  const streamUrl = channel?.streamUrl || null;
  const isYoutube = isYoutubeUrl(streamUrl);
  const ytId = getYoutubeId(streamUrl);
  const fallbackRef = useRef(false);

  useEffect(() => {
    loadHls().then(() => setHlsReady(true)).catch(() => {});
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl || !hlsReady || isYoutube) return;

    let active = true;
    fallbackRef.current = false;

    async function setup(url) {
      const Hls = window.Hls;
      if (!Hls) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (active) {
            video.play().catch(() => {});
          }
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal && active) {
            // Fallback: si la URL proxeada falla, reintentar con URL directa
            if (!fallbackRef.current) {
              fallbackRef.current = true;
              const direct = extractDirectUrl(url);
              if (direct) {
                setup(direct);
                return;
              }
            }
            setStatus('error');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      }
    }

    setup(streamUrl);

    return () => {
      active = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, hlsReady]);

  useEffect(() => {
    if (isYoutube) { setStatus('playing'); return; }
    const video = videoRef.current;
    if (!video) return;

    function onEvent() { setStatus(getStatusFromVideo(video)); }
    function onError() { setStatus('error'); }

    video.addEventListener('loadstart', onEvent);
    video.addEventListener('canplay', onEvent);
    video.addEventListener('playing', onEvent);
    video.addEventListener('waiting', onEvent);
    video.addEventListener('stalled', onEvent);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('loadstart', onEvent);
      video.removeEventListener('canplay', onEvent);
      video.removeEventListener('playing', onEvent);
      video.removeEventListener('waiting', onEvent);
      video.removeEventListener('stalled', onEvent);
      video.removeEventListener('error', onError);
    };
  }, [streamUrl, isYoutube]);

  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
    };
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [dropdownOpen]);

  const handleChannelChange = useCallback((id) => {
    onChannelChange?.(id);
    setDropdownOpen(false);
  }, [onChannelChange]);

  const isLive = match?.status === 'live';

  useEffect(() => {
    if (!isYoutube) setStatus('loading');
  }, [streamUrl, isYoutube]);

  /* ── Fullscreen API ── */
  const toggleFullscreen = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }, []);

  /* ── Auto-hide controls on mobile after 3s ── */
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    if (isMobile) {
      controlsTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [isMobile]);

  useEffect(() => {
    showControls();
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [streamUrl, showControls]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => { onFocus?.(); showControls(); }}
      style={[styles.panel, focused && styles.panelFocused, { borderRadius: isMobile ? 0 : 8 * scale }]}
    >
      <View ref={dropdownRef} style={[styles.channelStrip, { height: 34 * scale }]}>
        <Pressable
          style={[styles.dropdownTrigger, { paddingHorizontal: 10 * scale, paddingVertical: 4 * scale, borderRadius: 4 * scale }]}
          onPress={() => setDropdownOpen((o) => !o)}
        >
          <Text style={[styles.dropdownTriggerText, { fontSize: 11 * scale }]}>
            {channel.name.toUpperCase()}
          </Text>
          <Text style={[styles.dropdownArrow, { fontSize: 8 * scale }]}>▼</Text>
        </Pressable>

        {dropdownOpen && (
          <View style={[styles.dropdownList, { top: 34 * scale }]}>
            {CHANNELS.map((ch) => {
              const active = ch.id === channelId;
              return (
                <Pressable
                  key={ch.id}
                  style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                  onPress={() => handleChannelChange(ch.id)}
                >
                  <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive, { fontSize: 11 * scale }]}>
                    {ch.name}
                  </Text>
                  {active && status === 'playing' && (
                    <Text style={[styles.liveDot, { fontSize: 7 * scale }]}>●</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View ref={wrapRef} style={styles.videoWrap}>
        {streamUrl && isYoutube && ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${muted ? 1 : 0}&controls=1&rel=0`}
            style={styles.video}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        ) : streamUrl ? (
          <video
            ref={videoRef}
            style={styles.video}
            autoPlay
            muted={muted}
            playsInline
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={[styles.phIcon, { fontSize: 28 * scale }]}>📡</Text>
            <Text style={[styles.phTitle, { fontSize: 16 * scale }]}>{channel.name}</Text>
            <Text style={[styles.phSub, { fontSize: 12 * scale }]}>{channel.note || ''}</Text>
            <Text style={[styles.phHint, { fontSize: 10 * scale, marginTop: 4 * scale }]}>Elegí un canal arriba</Text>
          </View>
        )}

        {streamUrl && !isYoutube && status === 'loading' && (
          <View style={styles.overlay}>
            <Text style={[styles.loadingText, { fontSize: 13 * scale }]}>Conectando...</Text>
          </View>
        )}
        {streamUrl && !isYoutube && status === 'error' && (
          <View style={styles.overlay}>
            <Text style={[styles.errorText, { fontSize: 14 * scale }]}>Sin señal</Text>
          </View>
        )}

        {match && isLive && (
          <View style={[styles.badge, styles.badgeLive, { left: 10 * scale, paddingHorizontal: 12 * scale, paddingVertical: 5 * scale, borderRadius: 4 * scale, gap: 6 * scale }]}>
            <View style={[styles.badgeDot, { width: 8 * scale, height: 8 * scale, borderRadius: 4 * scale }]} />
            <Text style={[styles.badgeText, { fontSize: 10 * scale }]}>EN VIVO</Text>
          </View>
        )}

        {streamUrl && !isYoutube && controlsVisible && (
          <Pressable
            style={[styles.fullscreenBtn, { top: isMobile ? 6 : 8, right: isMobile ? 6 : 8, padding: isMobile ? 6 : 8 * scale, borderRadius: isMobile ? 4 : 6 * scale }]}
            onPress={toggleFullscreen}
          >
            <Text style={[styles.fullscreenIcon, { fontSize: isMobile ? 16 : 18 * scale }]}>⛶</Text>
          </Pressable>
        )}
      </View>

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#222',
  },
  videoWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  panelFocused: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  channelStrip: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  dropdownTriggerText: { color: COLORS.white, fontWeight: '600', letterSpacing: 1 },
  dropdownArrow: { color: COLORS.dim },
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 6,
    zIndex: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  dropdownItemActive: { backgroundColor: COLORS.goldDim },
  dropdownItemText: { color: COLORS.dim, fontWeight: '500' },
  dropdownItemTextActive: { color: COLORS.gold },
  liveDot: { color: COLORS.live },
  video: { flex: 1, width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  phIcon: {},
  phTitle: { color: COLORS.white, fontWeight: 'bold' },
  phSub: { color: COLORS.dim },
  phHint: { color: COLORS.gold, fontStyle: 'italic' },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: { color: COLORS.gold, fontWeight: '600' },
  errorText: { color: COLORS.dim, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: 8,
    backgroundColor: COLORS.panel,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeLive: { backgroundColor: COLORS.live },
  badgeDot: { backgroundColor: '#fff' },
  badgeText: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 },
  fullscreenBtn: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 15,
  },
  fullscreenIcon: { color: '#fff' },
  infoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: { color: COLORS.dim, fontWeight: '600' },
  infoDate: { color: COLORS.gold, fontWeight: '700' },

});