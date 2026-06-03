import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import MatchCard from './MatchCard';
import { COLORS } from '../constants/theme';

export default function BottomBar({ matches = [], compact, margin }) {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const barW = compact ? windowWidth - margin * 2 : undefined;
  const barH = compact ? 110 : 200 * scale;
  const barPad = compact ? 8 : 20 * scale;

  const active = matches.filter((m) => m.status === 'live' || m.status === 'finished');

  if (active.length === 0) {
    return (
      <View style={[styles.container, { height: barH, padding: barPad }]}>
        <View style={styles.overview}>
          <Text style={[styles.overviewTitle, { fontSize: compact ? 15 : 22 * scale, marginBottom: compact ? 6 : 20 }]}>MUNDIAL 2026</Text>
          <View style={[styles.statsRow, { gap: compact ? 8 : 20 }]}>
            <View style={[styles.statItem, { minWidth: compact ? 40 : 70 }]}>
              <Text style={[styles.statNumber, { fontSize: compact ? 16 : 28 * scale }]}>48</Text>
              <Text style={[styles.statLabel, { fontSize: compact ? 8 : 11 * scale }]}>EQUIPOS</Text>
            </View>
            <View style={[styles.sep, { height: compact ? 24 : 40 }]} />
            <View style={[styles.statItem, { minWidth: compact ? 40 : 70 }]}>
              <Text style={[styles.statNumber, { fontSize: compact ? 16 : 28 * scale }]}>12</Text>
              <Text style={[styles.statLabel, { fontSize: compact ? 8 : 11 * scale }]}>GRUPOS</Text>
            </View>
            <View style={[styles.sep, { height: compact ? 24 : 40 }]} />
            <View style={[styles.statItem, { minWidth: compact ? 40 : 70 }]}>
              <Text style={[styles.statNumber, { fontSize: compact ? 16 : 28 * scale }]}>104</Text>
              <Text style={[styles.statLabel, { fontSize: compact ? 8 : 11 * scale }]}>PARTIDOS</Text>
            </View>
            <View style={[styles.sep, { height: compact ? 24 : 40 }]} />
            <View style={[styles.statItem, { minWidth: compact ? 40 : 70 }]}>
              <Text style={[styles.statNumber, { fontSize: compact ? 16 : 28 * scale }]}>16</Text>
              <Text style={[styles.statLabel, { fontSize: compact ? 8 : 11 * scale }]}>ESTADIOS</Text>
            </View>
            <View style={[styles.sep, { height: compact ? 24 : 40 }]} />
            <View style={[styles.statItem, { minWidth: compact ? 40 : 70 }]}>
              <Text style={[styles.statNumber, { fontSize: compact ? 16 : 28 * scale }]}>EE.UU.</Text>
              <Text style={[styles.statLabel, { fontSize: compact ? 8 : 11 * scale }]}>SEDE</Text>
            </View>
          </View>
          {!compact && <Text style={[styles.overviewSub, { fontSize: 13 * scale }]}>Comienza el 11 de junio de 2026</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: barH, padding: barPad, gap: compact ? 8 : 25 }]}>
      {active.slice(0, compact ? 2 : 3).map((m) => (
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
          status={m.status === 'finished' ? 'FINALIZADO' : undefined}
          isLive={m.status === 'live'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.panel,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overviewTitle: { color: COLORS.gold, fontWeight: 'bold', letterSpacing: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statNumber: { color: COLORS.white, fontWeight: '800' },
  statLabel: { color: COLORS.dim, fontWeight: '600', marginTop: 2, letterSpacing: 1 },
  sep: { width: 1, backgroundColor: '#333' },
  overviewSub: { color: COLORS.dim, fontStyle: 'italic' },
});
