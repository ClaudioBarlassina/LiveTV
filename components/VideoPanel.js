import { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CHANNELS, isYoutubeUrl, getYoutubeId } from '../constants/channels';
import { COLORS } from '../constants/theme';

const STATUS_MAP = {
  idle: 'idle',
  loading: 'loading',
  readyToPlay: 'playing',
  error: 'error',
};

export default function VideoPanel({ match, channelId, onChannelChange, onFocus, focused, muted = true, active = true }) {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const [status, setStatus] = useState('idle');

  const channel = CHANNELS.find((c) => c.id === channelId) || CHANNELS[0];
  const streamUrl = channel?.streamUrl || null;
  const isYoutube = isYoutubeUrl(streamUrl);
  const ytId = getYoutubeId(streamUrl);

  const player = useVideoPlayer(streamUrl && !isYoutube ? { uri: streamUrl } : null, (p) => {
    if (streamUrl) {
      if (active) p.play();
      p.muted = muted;
    }
  });

  const { status: playerStatus } = useEvent(player, 'statusChange', {
    status: player?.status,
  });

  useEffect(() => {
    setStatus(STATUS_MAP[playerStatus] || 'idle');
  }, [playerStatus]);

  useEffect(() => {
    if (!player) return;
    if (active) {
      player.play();
      player.muted = muted;
    } else {
      player.pause();
    }
  }, [muted, player, active]);

  useEffect(() => {
    return () => {
      try { player?.pause(); } catch {}
    };
  }, [player]);

  const isLive = match?.status === 'live';

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => onFocus?.()}
      onFocus={() => onFocus?.()}
      style={[styles.panel, focused && styles.panelFocused, { borderRadius: 8 * scale }]}
    >
      {/* Channel strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.channelStrip, { height: 34 * scale }]} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 8 * scale, gap: 4 * scale }}>
        {CHANNELS.map((ch) => {
          const active = ch.id === channelId;
          return (
            <Pressable
              key={ch.id}
              style={({ focused }) => [styles.chBtn, active && styles.chBtnActive, focused && styles.chBtnFocused, { paddingHorizontal: 10 * scale, paddingVertical: 4 * scale, borderRadius: 4 * scale, gap: 3 * scale }]}
              onPress={() => onChannelChange?.(ch.id)}
            >
              <Text style={[styles.chLabel, active && styles.chLabelActive, { fontSize: 11 * scale }]}>
                {ch.name.toUpperCase()}
              </Text>
              {active && player?.playing && (
                <Text style={[styles.liveDot, { fontSize: 7 * scale }]}>●</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Video / Placeholder */}
      {streamUrl && isYoutube ? (
        <View style={styles.placeholder}>
          <Text style={[styles.phIcon, { fontSize: 28 * scale }]}>▶️ YouTube</Text>
          <Text style={[styles.phTitle, { fontSize: 16 * scale }]}>{channel.name}</Text>
          <Text style={[styles.phHint, { fontSize: 10 * scale, marginTop: 4 * scale }]}>Abrí YouTube para ver</Text>
        </View>
      ) : streamUrl ? (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls={false}
          allowsVideoFrameAnalysis={false}
          {...(Platform.isTV ? { focusable: false } : {})}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={[styles.phIcon, { fontSize: 28 * scale }]}>📡</Text>
          <Text style={[styles.phTitle, { fontSize: 16 * scale }]}>{channel.name}</Text>
          <Text style={[styles.phSub, { fontSize: 12 * scale }]}>{channel.note || ''}</Text>
          <Text style={[styles.phHint, { fontSize: 10 * scale, marginTop: 4 * scale }]}>Elegí un canal arriba</Text>
        </View>
      )}

      {/* Status overlay */}
      {streamUrl && !isYoutube && status === 'loading' && (
        <View style={[styles.overlay, { top: 34 * scale }]}>
          <Text style={[styles.loadingText, { fontSize: 13 * scale }]}>Conectando...</Text>
        </View>
      )}
      {streamUrl && !isYoutube && status === 'error' && (
        <View style={[styles.overlay, { top: 34 * scale }]}>
          <Text style={[styles.errorText, { fontSize: 14 * scale }]}>Sin señal</Text>
        </View>
      )}

      {/* Live badge */}
      {match && isLive && (
        <View style={[styles.badge, styles.badgeLive, { top: 42 * scale, left: 10 * scale, paddingHorizontal: 12 * scale, paddingVertical: 5 * scale, borderRadius: 4 * scale, gap: 6 * scale }]}>
          <View style={[styles.badgeDot, { width: 8 * scale, height: 8 * scale, borderRadius: 4 * scale }]} />
          <Text style={[styles.badgeText, { fontSize: 10 * scale }]}>EN VIVO</Text>
        </View>
      )}


    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  panelFocused: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  channelStrip: {
    height: 34,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  chBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chBtnActive: { backgroundColor: COLORS.goldDim },
  chBtnFocused: { borderColor: COLORS.gold, borderWidth: 1 },
  chLabel: { color: COLORS.dim, fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  chLabelActive: { color: COLORS.gold },
  liveDot: { color: COLORS.live, fontSize: 7 },
  video: { flex: 1 },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  phIcon: { fontSize: 28 },
  phTitle: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  phSub: { color: COLORS.dim, fontSize: 12 },
  phHint: { color: COLORS.gold, fontSize: 10, marginTop: 4, fontStyle: 'italic' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    top: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: { color: COLORS.gold, fontSize: 13, fontWeight: '600' },
  errorText: { color: COLORS.dim, fontSize: 14, fontWeight: '600' },
  badge: {
    position: 'absolute',
    top: 42,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    backgroundColor: COLORS.panel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeLive: { backgroundColor: COLORS.live },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  infoBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  infoText: { color: COLORS.dim, fontSize: 11, fontWeight: '600' },
  infoDate: { color: COLORS.gold, fontSize: 11, fontWeight: '700' },

});
