import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, useWindowDimensions, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import VideoPanel from '../components/VideoPanel';
import Sidebar from '../components/Sidebar';
import BottomBar from '../components/BottomBar';
import NavBar from '../components/NavBar';
import Countdown from '../components/Countdown';
import FinishedMatches from '../components/FinishedMatches';
import GroupTable from '../components/GroupTable';
import UpcomingMatches from '../components/UpcomingMatches';
import { loadChannels } from '../constants/channels';
import { fetchLiveMatches } from '../services/api';
import { COLORS } from '../constants/theme';

const COMPACT_BREAK = 800;
const MOBILE_BREAK = 500;

export default function LiveMatch() {
  const [matches, setMatches] = useState([]);
  const [matchA, setMatchA] = useState(null);
  const [matchB, setMatchB] = useState(null);
  const [matchC, setMatchC] = useState(null);
  const [channelA, setChannelA] = useState(null);
  const [channelB, setChannelB] = useState(null);
  const [channelC, setChannelC] = useState(null);
  const [focused, setFocused] = useState('A');
  const [layout, setLayout] = useState('full');
  const [giant, setGiant] = useState(false);
  const [focusKey, setFocusKey] = useState(0);
  const [chVer, setChVer] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [screenActive, setScreenActive] = useState(true);

  // Pause video when navigating away from live screen
  useFocusEffect(
    useCallback(() => {
      setScreenActive(true);
      return () => setScreenActive(false);
    }, [])
  );

  // Refresh channels & trigger re-render when gaining focus (e.g. returning from admin same tab)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadChannels(true).then(() => {
        if (active) setChVer((v) => v + 1);
      });
      return () => { active = false; };
    }, [])
  );

  // Poll channels every 30s (catches admin changes in another tab)
  useEffect(() => {
    let active = true;
    const poll = async () => {
      await loadChannels(true);
      if (active) setChVer((v) => v + 1);
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const matchARef = useRef(null);
  const matchBRef = useRef(null);

  const fetchData = useCallback(async () => {
    const data = await fetchLiveMatches();
    setMatches(data);

    setMatchA((prev) => {
      const match = prev ? data.find((m) => m.id === prev.id) : null;
      return match || data.find((m) => m.status === 'live') || data[0] || null;
    });

    setMatchB((prev) => {
      const match = prev ? data.find((m) => m.id === prev.id) : null;
      if (match) return match;
      const idA = matchARef.current?.id || data[0]?.id;
      return data.find((m) => m.id !== idA) || data[1] || null;
    });
  }, []);

  useEffect(() => { matchARef.current = matchA; }, [matchA]);
  useEffect(() => { matchBRef.current = matchB; }, [matchB]);

  useEffect(() => {
    if (!matchA || !matchB) return;
    setMatchC((prev) => {
      if (prev && matches.find((m) => m.id === prev.id)) return prev;
      const ids = [matchA.id, matchB.id];
      const third = matches.find((m) => !ids.includes(m.id));
      return third || matches[2] || null;
    });
  }, [matchA, matchB, matches]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setRefreshKey(k => k + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const promoteToMain = useCallback((target) => {
    if (target === 'B') {
      setMatchA(matchB);
      setMatchB(matchA);
      setChannelA(channelB);
      setChannelB(channelA);
      setFocused('A');
    } else if (target === 'C') {
      setMatchA(matchC);
      setMatchC(matchA);
      setChannelA(channelC);
      setChannelC(channelA);
      setFocused('A');
    }
  }, [matchA, matchB, matchC, channelA, channelB, channelC]);

  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const small = windowWidth < COMPACT_BREAK;
  const isMobile = windowWidth < MOBILE_BREAK;
  const compact = small && !isMobile;
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const padding = isMobile ? 0 : 5;

  const activeMatch = focused === 'A' ? matchA : focused === 'B' ? matchB : matchC;
  const hasContent = matches.some((m) => m.status !== 'upcoming');
  const bottomH = hasContent
    ? (small ? 110 : 200 * scale)
    : (small ? 80 : 90);

  /* ───────────────── MOBILE (web portrait) ───────────────── */
  if (isMobile) {
    const videoH = windowHeight * 0.38;
    return (
      <View style={styles.container}>
        <NavBar />
        <View style={{ height: videoH }}>
          <VideoPanel
            key={`mobile-video-${focusKey}`}
            match={matchA} channelId={channelA} onChannelChange={setChannelA}
            onFocus={() => setFocused('A')} focused muted={false} active={screenActive}
          />
        </View>
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ paddingBottom: 20 }}>
          <FinishedMatches matches={matches} />
          <GroupTable />
          <UpcomingMatches matches={matches} />
          {hasContent && (
            <View style={{ height: bottomH, marginTop: 8 }}>
              <BottomBar matches={matches} compact margin={0} />
            </View>
          )}
          {!hasContent && (
            <View style={{ height: bottomH, marginTop: 8 }}>
              <Countdown />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  /* ───────────────── DESKTOP / TABLET ─────────────────────── */
  return (
    <View style={[styles.container, { padding }]}>
      {!giant && <NavBar />}

      {/* Layout bar */}
      {!giant && (
        <View style={[styles.layoutBar, { paddingVertical: compact ? 2 : 6 * scale, paddingHorizontal: compact ? 6 : 4 }]}>
          <Pressable
            style={({ focused }) => [styles.layoutBtn, layout === 'full' && styles.layoutBtnActive, focused && styles.focusRing, { paddingHorizontal: compact ? 8 : 12 * scale, paddingVertical: compact ? 4 : 6 * scale, borderRadius: compact ? 4 : 6 * scale }]}
            onPress={() => { setLayout('full'); setGiant(false); }}
            {...(Platform.isTV ? { hasTVPreferredFocus: true } : {})}
          >
            <Text style={[styles.layoutLabel, layout === 'full' && styles.layoutLabelActive, { fontSize: compact ? 11 : 11 * scale }]}>FULL</Text>
          </Pressable>
          <Pressable
            style={({ focused }) => [styles.layoutBtn, layout === 'split' && styles.layoutBtnActive, focused && styles.focusRing, { paddingHorizontal: compact ? 8 : 12 * scale, paddingVertical: compact ? 4 : 6 * scale, borderRadius: compact ? 4 : 6 * scale }]}
            onPress={() => { setLayout('split'); setGiant(false); }}
          >
            <Text style={[styles.layoutLabel, layout === 'split' && styles.layoutLabelActive, { fontSize: compact ? 11 : 11 * scale }]}>SPLIT</Text>
          </Pressable>
          <Pressable
            style={({ focused }) => [styles.layoutBtn, layout === 'triple' && styles.layoutBtnActive, focused && styles.focusRing, { paddingHorizontal: compact ? 8 : 12 * scale, paddingVertical: compact ? 4 : 6 * scale, borderRadius: compact ? 4 : 6 * scale }]}
            onPress={() => { setLayout('triple'); setGiant(false); }}
          >
            <Text style={[styles.layoutLabel, layout === 'triple' && styles.layoutLabelActive, { fontSize: compact ? 11 : 11 * scale }]}>1+2</Text>
          </Pressable>
        </View>
      )}

      {/* Main content: video + sidebar */}
      {!giant && (
        <View style={styles.mainRow}>
          <View style={styles.videoArea}>

            {layout === 'full' && (
              <View style={styles.fullPanel}>
                <VideoPanel
                  key={`full-${focusKey}`}
                  match={matchA} channelId={channelA} onChannelChange={setChannelA}
                  onFocus={() => setFocused('A')} focused muted={false} active={screenActive}
                />
                <Pressable style={({ focused }) => [styles.giantBtn, focused && styles.focusRing, { top: compact ? 4 : 8, right: compact ? 4 : 8, paddingHorizontal: compact ? 6 : 10 * scale, paddingVertical: compact ? 4 : 6 * scale, borderRadius: compact ? 4 : 6 * scale }]} onPress={() => setGiant(true)}>
                  <Text style={[styles.giantBtnText, { fontSize: compact ? 12 : 13 * scale }]}>⛶</Text>
                </Pressable>
              </View>
            )}

            {layout === 'split' && (
              <View style={styles.splitRow}>
                <View style={styles.splitHalf}>
                  <VideoPanel
                    key={`split-a-${focusKey}`}
                    match={matchA} channelId={channelA} onChannelChange={setChannelA}
                    onFocus={() => setFocused('A')} focused={focused === 'A'} muted={focused !== 'A'} active={screenActive}
                  />
                </View>
                {!compact && <View style={styles.divider} />}
                <View style={styles.splitHalf}>
                  <VideoPanel
                    key={`split-b-${focusKey}`}
                    match={matchB} channelId={channelB} onChannelChange={setChannelB}
                    onFocus={() => setFocused('B')} focused={focused === 'B'} muted={focused !== 'B'} active={screenActive}
                  />
                </View>
              </View>
            )}

            {layout === 'triple' && (
              <View style={styles.tripleRow}>
                <View style={styles.tripleMain}>
                  <VideoPanel
                    key={`triple-a-${focusKey}`}
                    match={matchA} channelId={channelA} onChannelChange={setChannelA}
                    onFocus={() => setFocused('A')} focused={focused === 'A'} muted={false} active={screenActive}
                  />
                </View>
                {!compact && <View style={styles.dividerSm} />}
                <View style={styles.tripleSide}>
                  <View style={styles.tripleSmall}>
                    <VideoPanel
                      key={`triple-b-${focusKey}`}
                      match={matchB} channelId={channelB} onChannelChange={setChannelB}
                      onFocus={() => promoteToMain('B')} focused={false} muted active={screenActive}
                    />
                  </View>
                  <View style={styles.tripleSmall}>
                    <VideoPanel
                      key={`triple-c-${focusKey}`}
                      match={matchC} channelId={channelC} onChannelChange={setChannelC}
                      onFocus={() => promoteToMain('C')} focused={false} muted active={screenActive}
                    />
                  </View>
                </View>
              </View>
            )}

          </View>

          {!compact && <Sidebar matchA={matchA} match={activeMatch} matches={matches} refreshKey={refreshKey} />}
        </View>
      )}

      {!giant && (
        <View style={[styles.bottomRow, { height: bottomH }]}>
          {!hasContent ? (
            <View style={styles.countdownBox}>
              <Countdown />
            </View>
          ) : (
            <BottomBar matches={matches} compact={compact} margin={padding} />
          )}
        </View>
      )}

      {layout === 'full' && giant && (
        <View style={styles.giantContainer}>
          <VideoPanel
            key={`giant-${focusKey}`}
            match={matchA} channelId={channelA} onChannelChange={setChannelA}
            onFocus={() => setFocused('A')} focused muted={false} active={screenActive}
          />
          <Pressable style={({ focused }) => [styles.giantBtn, focused && styles.focusRing, { top: compact ? 10 : 20, right: compact ? 10 : 20, paddingHorizontal: compact ? 8 : 12 * scale, paddingVertical: compact ? 5 : 8 * scale, borderRadius: compact ? 4 : 6 * scale }]} onPress={() => setGiant(false)} {...(Platform.isTV ? { hasTVPreferredFocus: true } : {})}>
            <Text style={[styles.giantBtnText, { fontSize: compact ? 11 : 11 * scale }]}>SALIR</Text>
          </Pressable>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  layoutBar: {
    flexDirection: 'row',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.panel,
  },
  layoutBtn: {
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#333',
  },
  layoutBtnActive: { backgroundColor: COLORS.goldDim, borderColor: COLORS.gold },
  focusRing: { borderColor: COLORS.gold, borderWidth: 2 },
  layoutLabel: { color: COLORS.dim, fontWeight: '600', letterSpacing: 1 },
  layoutLabelActive: { color: COLORS.gold },

  // Main row: video + sidebar
  mainRow: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  videoArea: {
    flex: 1,
    paddingBottom: 10,
  },

  // Full
  fullPanel: {
    flex: 1,
  },

  // Split
  splitRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  splitHalf: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 9,
  },

  // Triple
  tripleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tripleMain: {
    flex: 3,
  },
  tripleSide: {
    flex: 2,
    justifyContent: 'space-between',
  },
  tripleSmall: {
    flex: 1,
  },
  dividerSm: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 9,
  },

  // Giant
  giantBtn: {
    position: 'absolute',
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#333',
    zIndex: 110,
  },
  giantBtnText: { color: COLORS.gold, fontWeight: '600', letterSpacing: 1 },
  giantContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
    padding: 0,
  },

  // Bottom
  bottomRow: {
    flexShrink: 0,
  },
  countdownBox: {
    backgroundColor: COLORS.panel,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
  },
});
