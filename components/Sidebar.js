import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import StatsPanel from './StatsPanel';
import GroupTable from './GroupTable';
import UpcomingMatches from './UpcomingMatches';
import { COLORS } from '../constants/theme';

export default function Sidebar({ match, matches }) {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const sideW = 440 * scale;
  const sidePad = 25 * scale;

  return (
    <View style={[styles.sidebar, { width: sideW }]}>
      <View style={{ flex: 1, padding: sidePad, gap: 12, justifyContent: 'flex-start' }}>
        {match && <StatsPanel match={match} />}
        <GroupTable />
        <UpcomingMatches matches={matches} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: COLORS.panel,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    gap: 20,
  },
});
