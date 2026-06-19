import { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import MatchCard from './MatchCard';
import { COLORS } from '../constants/theme';

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

export default function FinishedMatches({ matches = [] }) {
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 500;
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));

  const finished = matches.filter((m) => m.status === 'finished' && isToday(m.date));
  const [finishIdx, setFinishIdx] = useState(0);
  const timerRef = useRef(null);
  const fadeAnim = useMemo(() => new Animated.Value(1), []);
  const slideAnim = useMemo(() => new Animated.Value(0), []);
  const firstRun = useRef(true);

  useEffect(() => {
    if (finished.length < 2) {
      setFinishIdx(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setFinishIdx(prev => (prev + 1) % finished.length);
    }, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [finished.length]);

  useEffect(() => {
    if (finished.length === 0) return;
    if (firstRun.current) { firstRun.current = false; return; }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  }, [finishIdx, finished.length]);

  if (finished.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: isMobile ? 14 : 16 * scale }]}>FINALIZADOS</Text>
        <Text style={[styles.empty, { fontSize: isMobile ? 12 : 13 * scale }]}>Sin partidos finalizados hoy</Text>
      </View>
    );
  }

  const m = finished[finishIdx % finished.length];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: isMobile ? 14 : 16 * scale }]}>FINALIZADOS</Text>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
        <MatchCard
          key={m.id}
          team1={m.home_team || 'TBD'}
          team2={m.away_team || 'TBD'}
          score1={m.home_score}
          score2={m.away_score}
          flag1={m.home_flag}
          flag2={m.away_flag}
          iso1={m.home_iso2}
          iso2={m.away_iso2}
          status="FINALIZADO"
          isLive={false}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  title: { color: COLORS.gold, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 6 },
  empty: { color: COLORS.dim, textAlign: 'center', fontStyle: 'italic', paddingVertical: 10 },
});
