import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import TeamFlag from './TeamFlag';
import { COLORS } from '../constants/theme';

export default function ScoreOverlay({ team1, team2, score1, score2, flag1, flag2, iso1, iso2, isLive }) {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));

  return (
    <View style={[styles.overlay, isLive && styles.overlayLive, { paddingHorizontal: 40 * scale, paddingVertical: 15 * scale, gap: 25 * scale }]}>
      <View style={[styles.teamBlock, { minWidth: 100 * scale, gap: 6 * scale }]}>
        <TeamFlag name={team1} iso2={iso1} size={28 * scale} />
        <Text style={[styles.team, { fontSize: 24 * scale }]}>{team1 || '—'}</Text>
      </View>
      <Text style={[styles.score, isLive && styles.scoreLive, { fontSize: 42 * scale }]}>
        {score1 != null ? score1 : '?'} - {score2 != null ? score2 : '?'}
      </Text>
      <View style={[styles.teamBlock, { minWidth: 100 * scale, gap: 6 * scale }]}>
        <TeamFlag name={team2} iso2={iso2} size={28 * scale} />
        <Text style={[styles.team, { fontSize: 24 * scale }]}>{team2 || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: COLORS.overlay,
    flexDirection: 'row',
    borderRadius: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.gold,
    zIndex: 10,
  },
  overlayLive: { borderBottomColor: COLORS.live },
  teamBlock: { alignItems: 'center' },
  team: { color: COLORS.white, fontWeight: 'bold', letterSpacing: 2 },
  score: { color: COLORS.gold, fontWeight: '800' },
  scoreLive: { color: COLORS.live },
});
