import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import TeamFlag from './TeamFlag';
import { COLORS } from '../constants/theme';

export default function MatchCard({ team1, team2, score1, score2, flag1, flag2, iso1, iso2, status, isLive }) {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));

  return (
    <View style={[styles.card, isLive && styles.cardLive, { minWidth: 310 * scale, height: 180 * scale, padding: 20 * scale }]}>
      <View style={styles.teamRow}>
        <TeamFlag name={team1} iso2={iso1} size={20 * scale} />
        <Text style={[styles.teams, { fontSize: 18 * scale }]}>{team1}</Text>
      </View>
      <Text style={[styles.score, { fontSize: 36 * scale }]}>{score1 != null && score2 != null ? `${score1} - ${score2}` : 'vs'}</Text>
      <View style={styles.teamRow}>
        <TeamFlag name={team2} iso2={iso2} size={20 * scale} />
        <Text style={[styles.teams, { fontSize: 18 * scale }]}>{team2}</Text>
      </View>
      <Text style={[styles.status, isLive && styles.statusLive, { fontSize: 12 * scale }]}>
        {isLive ? 'EN VIVO' : status || 'FINALIZADO'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.panelLight,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  cardLive: { borderWidth: 2, borderColor: COLORS.live },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teams: { color: COLORS.white, fontWeight: 'bold' },
  score: { color: COLORS.gold, fontWeight: '800', textAlign: 'center' },
  status: { color: COLORS.dim },
  statusLive: { color: COLORS.live, fontWeight: 'bold' },
});
