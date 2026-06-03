import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchLiveMatches } from '../services/api';
import { COLORS, FONTS } from '../constants/theme';

export default function UpcomingMatches() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetchLiveMatches().then(setMatches);
  }, []);

  const upcoming = matches.filter((m) => m.status === 'scheduled' || m.status === 'upcoming').slice(0, 3);

  if (upcoming.length === 0) {
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
      {upcoming.map((m) => (
        <View key={m.id} style={styles.row}>
          <Text style={styles.match}>
            {(m.home_team || 'TBD').toUpperCase()} vs {(m.away_team || 'TBD').toUpperCase()}
          </Text>
          <Text style={styles.date}>
            {m.date ? new Date(m.date).toLocaleDateString('es-AR', { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
          </Text>
        </View>
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
