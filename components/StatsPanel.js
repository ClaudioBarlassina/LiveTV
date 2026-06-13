import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import TeamFlag from './TeamFlag';
import { COLORS, FONTS } from '../constants/theme';

function generateMockEvents(match) {
  if (!match || match.status === 'upcoming') return [];
  const home = match.home_team || 'Local';
  const away = match.away_team || 'Visitante';
  const isLive = match.status === 'live';

  const events = [
    { time: "10'", type: 'goal', icon: '⚽', detail: `Gol - Messi (${home})` },
    { time: "22'", type: 'yellow', icon: '🟨', detail: `Tarjeta amarilla - Jugador (${home})` },
    { time: "35'", type: 'goal', icon: '⚽', detail: `Gol - Mbappé (${away})` },
    { time: "45+2'", type: 'yellow', icon: '🟨', detail: `Tarjeta amarilla - Jugador (${away})` },
    { time: "46'", type: 'sub', icon: '🔄', detail: `Cambio - Sale X, entra Y (${home})` },
  ];

  if (isLive) return events.slice(0, 3);
  return events;
}

export default function StatsPanel({ match }) {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const [viewMode, setViewMode] = useState('detalle');

  if (!match) return null;

  const events = useMemo(() => generateMockEvents(match), [match]);
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';

  return (
    <View style={styles.container}>
      {/* Toggle */}
      <View style={[styles.toggleRow, { borderRadius: 6 * scale }]}>
        <Pressable
          style={({ focused }) => [styles.toggleBtn, viewMode === 'detalle' && styles.toggleActive, focused && styles.toggleFocused]}
          onPress={() => setViewMode('detalle')}
        >
          <Text style={[styles.toggleText, viewMode === 'detalle' && styles.toggleTextActive, { fontSize: 11 * scale }]}>DETALLE</Text>
        </Pressable>
        <Pressable
          style={({ focused }) => [styles.toggleBtn, viewMode === 'eventos' && styles.toggleActive, focused && styles.toggleFocused]}
          onPress={() => setViewMode('eventos')}
        >
          <Text style={[styles.toggleText, viewMode === 'eventos' && styles.toggleTextActive, { fontSize: 11 * scale }]}>EVENTOS</Text>
        </Pressable>
      </View>

      {viewMode === 'detalle' ? (
        /* ──── DETALLE ──── */
        <View>
          {/* Score header */}
          <View style={[styles.scoreHeader, { gap: 10 * scale, paddingVertical: 10 * scale }]}>
            <View style={styles.teamCol}>
              <TeamFlag name={match.home_team} iso2={match.home_iso2} size={32 * scale} />
              <Text style={[styles.teamName, { fontSize: 13 * scale }]} numberOfLines={1}>{match.home_team}</Text>
            </View>
            <View style={styles.scoreCol}>
              <Text style={[styles.score, isLive && styles.scoreLive, { fontSize: 28 * scale }]}>
                {isUpcoming ? 'vs' : `${match.home_score} - ${match.away_score}`}
              </Text>
              {isLive && (
                <View style={[styles.liveBadgeSm, { gap: 4 * scale, paddingHorizontal: 8 * scale, paddingVertical: 2 * scale, borderRadius: 3 * scale }]}>
                  <View style={[styles.liveDotSm, { width: 5 * scale, height: 5 * scale, borderRadius: 2.5 * scale }]} />
                  <Text style={[styles.liveLabelSm, { fontSize: 9 * scale }]}>
                    EN VIVO{match.time_elapsed && match.time_elapsed !== 'notstarted' ? ` ${match.time_elapsed}'` : ''}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.teamCol}>
              <TeamFlag name={match.away_team} iso2={match.away_iso2} size={32 * scale} />
              <Text style={[styles.teamName, { fontSize: 13 * scale }]} numberOfLines={1}>{match.away_team}</Text>
            </View>
          </View>

          {/* Detail rows */}
          <View style={styles.detailSection}>
            <View style={styles.row}>
              <Text style={[styles.label, { fontSize: 11 * scale }]}>Grupo</Text>
              <Text style={[styles.value, { fontSize: 11 * scale }]}>{match.group || '—'}</Text>
            </View>
            {match.matchday ? (
              <View style={styles.row}>
                <Text style={[styles.label, { fontSize: 11 * scale }]}>Jornada</Text>
                <Text style={[styles.value, { fontSize: 11 * scale }]}>{match.matchday}</Text>
              </View>
            ) : null}
            {match.stadium ? (
              <View style={styles.row}>
                <Text style={[styles.label, { fontSize: 11 * scale }]}>Estadio</Text>
                <Text style={[styles.value, { fontSize: 11 * scale }]}>{match.stadium}</Text>
              </View>
            ) : null}
            {match.date ? (
              <View style={styles.row}>
                <Text style={[styles.label, { fontSize: 11 * scale }]}>Fecha</Text>
                <Text style={[styles.value, { fontSize: 11 * scale }]}>
                  {new Date(match.date).toLocaleDateString('es-AR', {
                    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : (
        /* ──── EVENTOS ──── */
        <View>
          {events.length === 0 ? (
            <Text style={[styles.emptyEvents, { fontSize: 12 * scale }]}>
              {isUpcoming ? 'El partido aún no comenzó' : 'No hay eventos disponibles'}
            </Text>
          ) : (
            <View style={[styles.timeline, { gap: 12 * scale, paddingLeft: 8 * scale }]}>
              {events.map((ev, i) => (
                <View key={i} style={[styles.eventRow, { gap: 10 * scale }]}>
                  {/* Timeline line + dot */}
                  <View style={[styles.timelineSide, { width: 30 * scale }]}>
                    {i < events.length - 1 && <View style={[styles.timelineLine, { width: 2 * scale, left: 14 * scale }]} />}
                    <View style={[styles.timelineDot, { width: 10 * scale, height: 10 * scale, borderRadius: 5 * scale }]} />
                  </View>
                  {/* Event content */}
                  <View style={[styles.eventContent, { paddingBottom: 8 * scale }]}>
                    <Text style={[styles.eventTime, { fontSize: 10 * scale }]}>{ev.time}</Text>
                    <View style={[styles.eventDetail, { gap: 6 * scale }]}>
                      <Text style={[styles.eventIcon, { fontSize: 14 * scale }]}>{ev.icon}</Text>
                      <Text style={[styles.eventText, { fontSize: 11 * scale }]}>{ev.detail}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.panelLight,
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleActive: {
    backgroundColor: COLORS.goldDim,
    borderColor: COLORS.gold,
  },
  toggleFocused: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  toggleText: { color: COLORS.dim, fontWeight: '700', letterSpacing: 1 },
  toggleTextActive: { color: COLORS.gold },

  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  teamCol: { flex: 1, alignItems: 'center', gap: 4 },
  teamName: { color: COLORS.white, fontWeight: 'bold', textAlign: 'center' },
  scoreCol: { alignItems: 'center', gap: 4 },
  score: { color: COLORS.white, fontWeight: '800', letterSpacing: 2 },
  scoreLive: { color: COLORS.live },
  liveBadgeSm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.live,
  },
  liveDotSm: { backgroundColor: '#fff' },
  liveLabelSm: { color: '#fff', fontWeight: 'bold', letterSpacing: 0.5 },

  detailSection: { gap: 6, paddingTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: COLORS.dim, fontWeight: '600' },
  value: { color: COLORS.white, fontWeight: '600', textAlign: 'right', maxWidth: '60%' },

  emptyEvents: { color: COLORS.dim, textAlign: 'center', fontStyle: 'italic', paddingVertical: 20 },

  timeline: {},
  eventRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineSide: { alignItems: 'center', position: 'relative' },
  timelineLine: {
    position: 'absolute',
    top: 12,
    bottom: -12,
    backgroundColor: '#333',
  },
  timelineDot: { backgroundColor: COLORS.gold, marginTop: 3 },
  eventContent: { flex: 1 },
  eventTime: { color: COLORS.gold, fontWeight: '700', marginBottom: 2 },
  eventDetail: { flexDirection: 'row', alignItems: 'center' },
  eventIcon: {},
  eventText: { color: COLORS.white, fontWeight: '500', flex: 1 },
});
