import { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { matchTime, matchDate } from '../services/dates';
import { COLORS } from '../constants/theme';

const MAX_VISIBLE = 3;

export default function UpcomingMatches({ matches: propMatches }) {
  const [matches, setMatches] = useState([]);
  const [offset, setOffset] = useState(0);
  const timerRef = useRef(null);
  const hasAnimated = useRef(false);

  const rowOpacity = useMemo(() => Array.from({ length: MAX_VISIBLE }, () => new Animated.Value(1)), []);
  const rowSlide = useMemo(() => Array.from({ length: MAX_VISIBLE }, () => new Animated.Value(0)), []);

  useEffect(() => {
    if (!propMatches) return;
    setMatches(propMatches);
  }, [propMatches]);

  const upcoming = matches.filter((m) => m.status === 'scheduled' || m.status === 'upcoming');

  useEffect(() => {
    if (upcoming.length <= 1) {
      setOffset(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOffset(prev => (prev + 1) % upcoming.length);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [upcoming.length, propMatches]);

  const displayed = useMemo(() => {
    if (offset === 0 || upcoming.length === 0) return upcoming;
    return [...upcoming.slice(offset), ...upcoming.slice(0, offset)];
  }, [upcoming, offset]);

  const show = displayed.slice(0, MAX_VISIBLE);

  useEffect(() => {
    const count = Math.min(MAX_VISIBLE, show.length);
    if (count === 0) return;
    if (!hasAnimated.current) { hasAnimated.current = true; return; }

    for (let i = 0; i < count; i++) {
      rowOpacity[i].setValue(0);
      rowSlide[i].setValue(40);
    }
    Animated.stagger(
      100,
      Array.from({ length: count }, (_, i) =>
        Animated.parallel([
          Animated.timing(rowOpacity[i], { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(rowSlide[i], { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      )
    ).start();
  }, [offset]);

  if (show.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>PRÓXIMOS</Text>
        <Text style={styles.empty}>Sin partidos programados</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PRÓXIMOS</Text>
      {show.map((m, i) => (
        <Animated.View
          key={m.id}
          style={[
            styles.row,
            i < MAX_VISIBLE && {
              opacity: rowOpacity[i],
              transform: [{ translateX: rowSlide[i] }],
            },
          ]}
        >
          <Text style={styles.match}>
            {(m.home_team || 'TBD').toUpperCase()} vs {(m.away_team || 'TBD').toUpperCase()}
          </Text>
          <Text style={styles.date}>
            {m.date ? `${matchDate(m.date, { weekday: 'short' })} ${matchTime(m.date)}` : '—'}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  title: { color: COLORS.gold, fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  match: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  date: { color: COLORS.dim, fontSize: 12 },
  empty: { color: COLORS.dim, fontSize: 12, textAlign: 'center' },
});
