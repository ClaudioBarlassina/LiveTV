import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { fetchLiveMatches, fetchMatchStats } from '../../services/api';
import TeamFlag from '../../components/TeamFlag';
import NavBar from '../../components/NavBar';
import { COLORS } from '../../constants/theme';

const STAT_ITEMS = [
  { key: 'possession', label: 'Posesión', suffix: '%', flip: true },
  { key: 'totalShots', label: 'Tiros totales' },
  { key: 'shotsOnGoal', label: 'Tiros al arco' },
  { key: 'shotsOffTarget', label: 'Tiros desviados' },
  { key: 'corners', label: 'Córners' },
  { key: 'fouls', label: 'Faltas' },
  { key: 'yellowCards', label: 'Tarjetas amarillas' },
  { key: 'redCards', label: 'Tarjetas rojas' },
  { key: 'offsides', label: 'Offsides' },
];

export default function MatchDetail() {
  const { id } = useLocalSearchParams();
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const [match, setMatch] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  const fetchData = useCallback(async () => {
    const matches = await fetchLiveMatches();
    const found = matches.find((m) => m.id === id) || matches[0] || null;
    setMatch(found);

    if (found && (found.status === 'live' || found.status === 'finished')) {
      const s = await fetchMatchStats(id);
      if (s) setStats(s);
    }
    if (found) setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.container}>
        <NavBar />
        <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.container}>
        <NavBar />
        <View style={styles.centerBox}>
          <Text style={styles.notFound}>Partido no encontrado</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>← VOLVER</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'upcoming';

  return (
    <View style={styles.container}>
      <NavBar />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { fontSize: 18 * scale }]}>← VOLVER</Text>
        </Pressable>

        {/* Header: Group/Round */}
        <Text style={[styles.headerSub, { fontSize: 14 * scale }]}>
          {match.type === 'group'
            ? `FASE DE GRUPOS · GRUPO ${match.group}`
            : match.type
              ? match.type.replace('_', ' ').toUpperCase()
              : ''}
          {match.matchday ? ` · JORNADA ${match.matchday}` : ''}
        </Text>

        {/* Score section */}
        <View style={styles.scoreSection}>
          <View style={styles.teamCol}>
            <TeamFlag name={match.home_team} iso2={match.home_iso2} size={80 * scale} />
            <Text style={[styles.teamName, { fontSize: 22 * scale }]} numberOfLines={2}>{match.home_team}</Text>
          </View>

          <View style={styles.scoreCol}>
            {isLive && <View style={styles.liveBadge}><Text style={styles.liveDot}>●</Text><Text style={styles.liveLabel}>EN VIVO</Text></View>}
            {isLive && match.time_elapsed && match.time_elapsed !== 'notstarted' && (
              <Text style={[styles.timeElapsed, { fontSize: 14 * scale }]}>{match.time_elapsed}'</Text>
            )}
            {!isUpcoming ? (
              <Text style={[styles.score, { fontSize: 56 * scale }]}>
                {match.home_score} - {match.away_score}
              </Text>
            ) : (
              <Text style={[styles.scheduledTime, { fontSize: 28 * scale }]}>
                {match.date
                  ? new Date(match.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </Text>
            )}
            {isFinished && <Text style={styles.finishedLabel}>FINALIZADO</Text>}
            {isUpcoming && match.date && (
              <Text style={[styles.scheduledDate, { fontSize: 14 * scale }]}>
                {new Date(match.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
          </View>

          <View style={styles.teamCol}>
            <TeamFlag name={match.away_team} iso2={match.away_iso2} size={80 * scale} />
            <Text style={[styles.teamName, { fontSize: 22 * scale }]} numberOfLines={2}>{match.away_team}</Text>
          </View>
        </View>

        {/* Match details */}
        <View style={styles.detailsCard}>
          {match.stadium && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Estadio</Text>
              <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>{match.stadium}</Text>
            </View>
          )}
          {match.stadium_city && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Ciudad</Text>
              <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>{match.stadium_city}</Text>
            </View>
          )}
          {match.date && !isUpcoming && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Fecha</Text>
              <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>
                {new Date(match.date).toLocaleDateString('es-AR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          )}
          {match.type === 'group' && match.group && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { fontSize: 12 * scale }]}>Grupo</Text>
              <Text style={[styles.detailValue, { fontSize: 14 * scale }]}>Grupo {match.group}</Text>
            </View>
          )}
        </View>

        {/* Live Stats */}
        {(isLive || isFinished) && (
          <View style={styles.statsSection}>
            <Text style={[styles.statsSectionTitle, { fontSize: 18 * scale }]}>
              ESTADÍSTICAS {isLive ? 'EN VIVO' : 'DEL PARTIDO'}
            </Text>

            {stats ? (
              <View style={styles.statsList}>
                {STAT_ITEMS.map((item) => {
                  const val = stats[item.key];
                  if (!val || !Array.isArray(val) || val.length < 2) return null;
                  const homeVal = item.flip ? val[1] : val[0];
                  const awayVal = item.flip ? val[0] : val[1];
                  const max = Math.max(homeVal, awayVal, 1);
                  const homePct = (homeVal / max) * 100;
                  const awayPct = (awayVal / max) * 100;
                  const suffix = item.suffix || '';

                  return (
                    <View key={item.key} style={styles.statRow}>
                      <Text style={[styles.statValue, { fontSize: 16 * scale }]}>{homeVal}{suffix}</Text>
                      <View style={styles.statBarWrap}>
                        <View style={styles.statBars}>
                          <View style={[styles.statBarHome, { width: `${homePct}%` }]} />
                        </View>
                        <Text style={[styles.statLabel, { fontSize: 11 * scale }]}>{item.label}</Text>
                        <View style={styles.statBars}>
                          <View style={[styles.statBarAway, { width: `${awayPct}%` }]} />
                        </View>
                      </View>
                      <Text style={[styles.statValue, { fontSize: 16 * scale }]}>{awayVal}{suffix}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.statsEmpty}>Las estadísticas estarán disponibles durante el partido</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60, alignItems: 'center' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },
  notFound: { color: COLORS.dim, fontSize: 20 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 10 },
  backText: { color: COLORS.gold, fontWeight: 'bold' },
  backLink: { color: COLORS.gold, fontWeight: 'bold', fontSize: 18 },

  headerSub: { color: COLORS.dim, fontWeight: '600', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },

  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 30,
    width: '100%',
    maxWidth: 800,
  },
  teamCol: { flex: 1, alignItems: 'center', gap: 10 },
  teamName: { color: COLORS.white, fontWeight: 'bold', textAlign: 'center' },
  scoreCol: { alignItems: 'center', gap: 6, minWidth: 180 },
  score: { color: COLORS.white, fontWeight: '800', letterSpacing: 4 },
  scheduledTime: { color: COLORS.gold, fontWeight: '700' },
  scheduledDate: { color: COLORS.dim, textTransform: 'capitalize' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  liveDot: { color: COLORS.live, fontSize: 10 },
  liveLabel: { color: COLORS.live, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  timeElapsed: { color: COLORS.live, fontWeight: 'bold' },
  finishedLabel: { color: COLORS.dim, fontSize: 12, fontWeight: '600', letterSpacing: 2, marginTop: 4 },

  detailsCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: COLORS.panel,
    borderRadius: 12,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#222',
    marginBottom: 30,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { color: COLORS.dim, fontWeight: '600' },
  detailValue: { color: COLORS.white, fontWeight: '600', textAlign: 'right', maxWidth: '60%' },

  statsSection: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: COLORS.panel,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  statsSectionTitle: { color: COLORS.gold, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, letterSpacing: 2 },
  statsList: { gap: 16 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statValue: { color: COLORS.white, fontWeight: '700', width: 50, textAlign: 'center' },
  statBarWrap: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { color: COLORS.dim, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statBars: { height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, width: '100%', overflow: 'hidden' },
  statBarHome: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 3 },
  statBarAway: { height: '100%', backgroundColor: COLORS.gold, borderRadius: 3 },
  statsEmpty: { color: COLORS.dim, textAlign: 'center', fontStyle: 'italic', fontSize: 13, padding: 20 },
});
