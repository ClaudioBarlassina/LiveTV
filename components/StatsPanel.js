import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export default function StatsPanel({ match }) {
  if (!match) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DETALLE DEL PARTIDO</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Grupo</Text>
        <Text style={styles.value}>{match.group || '—'}</Text>
      </View>

      {match.matchday ? (
        <View style={styles.row}>
          <Text style={styles.label}>Jornada</Text>
          <Text style={styles.value}>{match.matchday}</Text>
        </View>
      ) : null}

      {match.stadium ? (
        <View style={styles.row}>
          <Text style={styles.label}>Estadio</Text>
          <Text style={styles.value}>{match.stadium}</Text>
        </View>
      ) : null}

      {match.date ? (
        <View style={styles.row}>
          <Text style={styles.label}>Fecha</Text>
          <Text style={styles.value}>
            {new Date(match.date).toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      ) : null}

      {match.status === 'live' && (
        <View style={styles.statsNote}>
          <Text style={styles.statsNoteText}>
            Las estadísticas en vivo estarán disponibles durante el Mundial
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  title: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: COLORS.dim, fontSize: 12, fontWeight: '600' },
  value: { color: COLORS.white, fontSize: 12, fontWeight: '600', textAlign: 'right', maxWidth: '60%' },
  statsNote: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
  },
  statsNoteText: { color: COLORS.dim, fontSize: 10, textAlign: 'center', fontStyle: 'italic' },
});
