import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { fetchLiveMatches } from '../services/api';
import { COLORS } from '../constants/theme';

const ROUNDS = [
  { key: 'r32', label: '32AVOS DE FINAL' },
  { key: 'r16', label: 'OCTAVOS DE FINAL' },
  { key: 'qf', label: 'CUARTOS DE FINAL' },
  { key: 'sf', label: 'SEMIFINALES' },
  { key: 'third', label: 'TERCER PUESTO' },
  { key: 'final', label: 'FINAL' },
];

export default function Knockout() {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const isCompact = windowWidth < 800;
  const isTV = Platform.isTV;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches().then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const byRound = useMemo(() => {
    const rounds = {};
    for (const m of matches) {
      if (m.type === 'group') continue;
      if (!rounds[m.type]) rounds[m.type] = [];
      rounds[m.type].push(m);
    }
    return rounds;
  }, [matches]);

  return (
    <View style={[styles.container, { padding: isCompact ? 16 : 60 * scale }]}>
      <Link href="/" style={[styles.back, { fontSize: 18 * scale }]}>← VOLVER</Link>
      <Text style={[styles.title, { fontSize: 36 * scale }]}>FASE ELIMINATORIA</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.list}>
          {ROUNDS.map((round) => {
            const roundMatches = byRound[round.key] || [];
            return (
              <View key={round.key} style={styles.roundBlock}>
                <Text style={styles.roundTitle}>{round.label}</Text>
                <View style={styles.grid}>
                  {roundMatches.map((m, i) => (
                    <View key={m.id} style={[styles.matchCard, { width: 260 * scale, padding: 16 * scale }]} {...(isTV && i === 0 ? { focusable: true, hasTVPreferredFocus: true } : {})}>
                      <View style={styles.teamRow}>
                        <Text style={[styles.teamName, !m.home_team_id || m.home_team_id === '0' ? styles.tbd : null, { fontSize: 15 * scale }]}>
                          {m.home_team_id && m.home_team_id !== '0' ? m.home_team : 'A definir'}
                        </Text>
                        {m.status !== 'upcoming' ? (
                          <Text style={[styles.score, { fontSize: 20 * scale }]}>{m.home_score}</Text>
                        ) : null}
                      </View>
                      <View style={styles.teamRow}>
                        <Text style={[styles.teamName, !m.away_team_id || m.away_team_id === '0' ? styles.tbd : null, { fontSize: 15 * scale }]}>
                          {m.away_team_id && m.away_team_id !== '0' ? m.away_team : 'A definir'}
                        </Text>
                        {m.status !== 'upcoming' ? (
                          <Text style={[styles.score, { fontSize: 20 * scale }]}>{m.away_score}</Text>
                        ) : null}
                      </View>
                      <Text style={[styles.date, { fontSize: 11 * scale }]}>
                        {m.date
                          ? new Date(m.date).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  back: { color: COLORS.gold, fontWeight: 'bold', marginBottom: 20 },
  title: { color: COLORS.gold, fontWeight: 'bold', letterSpacing: 3, marginBottom: 30 },
  list: { flex: 1 },
  roundBlock: { marginBottom: 40 },
  roundTitle: { color: COLORS.white, fontSize: 22, fontWeight: 'bold', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.gold, paddingBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  matchCard: {
    backgroundColor: COLORS.panel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  teamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  teamName: { color: COLORS.white, fontWeight: '600', flex: 1 },
  tbd: { color: COLORS.dim, fontStyle: 'italic' },
  score: { color: COLORS.gold, fontWeight: '800', marginLeft: 12 },
  date: { color: COLORS.dim, marginTop: 8, textAlign: 'center' },
});
