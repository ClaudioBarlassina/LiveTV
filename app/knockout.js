import { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { fetchLiveMatches } from '../services/api';
import { matchTime, matchDate } from '../services/dates';
import NavBar from '../components/NavBar';
import TeamFlag from '../components/TeamFlag';
import { COLORS } from '../constants/theme';

const ROUNDS = [
  { key: 'r32', label: '32AVOS DE FINAL' },
  { key: 'r16', label: 'OCTAVOS DE FINAL' },
  { key: 'qf', label: 'CUARTOS DE FINAL' },
  { key: 'sf', label: 'SEMIFINALES' },
  { key: 'third', label: 'TERCER PUESTO' },
  { key: 'final', label: 'FINAL' },
];

function LivePulse() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [anim]);
  return anim;
}

function MatchCard({ match }) {
  const { width: w } = useWindowDimensions();
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'upcoming';
  const pulse = isLive ? LivePulse() : null;
  const ht = !match.home_team_id || match.home_team_id === '0';
  const at = !match.away_team_id || match.away_team_id === '0';

  return (
    <Animated.View style={[
      styles.card,
      isLive && { borderColor: COLORS.live, borderWidth: 2, opacity: pulse },
      isFinished && { borderColor: COLORS.gold, borderWidth: 1 },
      isUpcoming && { borderColor: '#222', borderWidth: 1 },
    ]}>
      <View style={styles.cardMain}>
        <View style={styles.teamCol}>
          {!ht && <TeamFlag name={match.home_team} iso2={match.home_iso2} size={22} />}
          <Text style={[styles.teamName, ht && styles.tbd]} numberOfLines={1}>
            {ht ? 'A definir' : match.home_team}
          </Text>
        </View>

        <View style={styles.scoreCol}>
          {isLive || isFinished ? (
            <Text style={[styles.score, isLive && { color: COLORS.live }, isFinished && { color: COLORS.gold }]}>
              {match.home_score} - {match.away_score}
            </Text>
          ) : (
            <Text style={styles.vs}>vs</Text>
          )}
          <View style={[styles.badge, isLive && styles.badgeLive, isFinished && styles.badgeFinished, isUpcoming && styles.badgeUpcoming]}>
            <Text style={[styles.badgeText, isLive && { color: '#fff' }, isFinished && { color: COLORS.gold }, isUpcoming && { color: COLORS.dim }]}>
              {isLive ? 'EN VIVO' : isFinished ? 'FINAL' : isUpcoming && match.date ? matchTime(match.date) : 'PRÓXIMO'}
            </Text>
          </View>
        </View>

        <View style={styles.teamCol}>
          <Text style={[styles.teamName, at && styles.tbd, { textAlign: 'right' }]} numberOfLines={1}>
            {at ? 'A definir' : match.away_team}
          </Text>
          {!at && <TeamFlag name={match.away_team} iso2={match.away_iso2} size={22} />}
        </View>
      </View>

      {(match.stadium || (isUpcoming && match.date)) && (
        <View style={styles.cardFooter}>
          {isUpcoming && match.date ? (
            <Text style={styles.footerText}>
              {matchDate(match.date, { weekday: 'short', day: 'numeric', month: 'short' })} {matchTime(match.date)}
            </Text>
          ) : isLive && match.time_elapsed && match.time_elapsed !== 'notstarted' ? (
            <Text style={styles.footerText}>{match.time_elapsed}'</Text>
          ) : null}
          {match.stadium ? (
            <Text style={styles.footerText} numberOfLines={1}>{match.stadium}{match.stadium_city ? `, ${match.stadium_city}` : ''}</Text>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}

export default function Knockout() {
  const { width: w } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, w / 1920));
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches().then((d) => { setMatches(d); setLoading(false); });
  }, []);

  const byRound = useMemo(() => {
    const r = {};
    for (const m of matches) {
      if (m.type === 'group') continue;
      if (!r[m.type]) r[m.type] = [];
      r[m.type].push(m);
    }
    return r;
  }, [matches]);

  return (
    <View style={styles.container}>
      <NavBar />
      <View style={{ flex: 1, padding: 5 }}>
        <Link href="/" style={[styles.back, { fontSize: 16 * scale }]}>← VOLVER</Link>
        <Text style={[styles.title, { fontSize: 30 * scale }]}>FASE ELIMINATORIA</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 40 }} />
        ) : (
          <ScrollView style={styles.list}>
            {ROUNDS.map((round) => {
              const ms = byRound[round.key] || [];
              if (ms.length === 0) return null;
              return (
                <View key={round.key} style={styles.roundBlock}>
                  <Text style={[styles.roundTitle, { fontSize: 18 * scale }]}>{round.label}</Text>
                  <View style={styles.grid}>
                    {ms.map((m) => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  back: { color: COLORS.gold, fontWeight: 'bold', marginBottom: 16 },
  title: { color: COLORS.gold, fontWeight: 'bold', letterSpacing: 3, marginBottom: 24 },
  list: { flex: 1 },
  roundBlock: { marginBottom: 30 },
  roundTitle: { color: COLORS.white, fontWeight: 'bold', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.gold, paddingBottom: 8, letterSpacing: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    backgroundColor: COLORS.panel,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 320,
    flex: 1,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamName: { color: COLORS.white, fontWeight: '700', fontSize: 14, flexShrink: 1 },
  tbd: { color: COLORS.dim, fontStyle: 'italic' },
  scoreCol: { alignItems: 'center', minWidth: 90 },
  score: { fontWeight: '900', fontSize: 22, letterSpacing: 2 },
  vs: { color: COLORS.dim, fontWeight: '700', fontSize: 16 },
  badge: { marginTop: 4, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12 },
  badgeLive: { backgroundColor: COLORS.live },
  badgeFinished: { backgroundColor: 'rgba(212,175,55,0.15)' },
  badgeUpcoming: { backgroundColor: '#1a1a1a' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    flexWrap: 'wrap',
  },
  footerText: { color: COLORS.dim, fontSize: 11, textAlign: 'center' },
});
