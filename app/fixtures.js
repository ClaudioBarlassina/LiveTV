import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, TextInput, Image, Platform, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { fetchLiveMatches, allGroups } from '../services/api';
import { matchTime, matchDate } from '../services/dates';
import NavBar from '../components/NavBar';
import TeamFlag from '../components/TeamFlag';
import { COLORS } from '../constants/theme';

const STATUSES = [
  { key: 'all', label: 'TODOS' },
  { key: 'live', label: 'EN VIVO' },
  { key: 'upcoming', label: 'PRÓXIMOS' },
  { key: 'finished', label: 'FINALIZADOS' },
];

function groupByDay(matches) {
  const days = {};
  for (const m of matches) {
    if (!m.date) continue;
    const key = matchDate(m.date, { weekday: 'long', day: 'numeric', month: 'long' });
    if (!days[key]) days[key] = [];
    days[key].push(m);
  }
  return Object.entries(days).sort((a, b) => a[1][0].date.slice(0, 10).localeCompare(b[1][0].date.slice(0, 10)));
}

export default function Fixtures() {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const isCompact = windowWidth < 800;
  const isTV = Platform.isTV;
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetchLiveMatches().then((data) => {
      setMatches(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = matches;

    if (groupFilter !== 'all') {
      list = list.filter((m) => m.group === groupFilter);
    }

    if (statusFilter !== 'all') {
      list = list.filter((m) => m.status === statusFilter);
    }

    if (teamFilter.trim()) {
      const q = teamFilter.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.home_team.toLowerCase().includes(q) ||
          m.away_team.toLowerCase().includes(q)
      );
    }

    return list;
  }, [matches, groupFilter, statusFilter, teamFilter]);

  const grouped = groupByDay(filtered);

  return (
    <View style={styles.container}>
      <NavBar />
      <ScrollView style={{ flex: 1, padding: 5 }}>
      <Link href="/" style={[styles.back, { fontSize: 18 * scale }]}>← VOLVER</Link>
      <Text style={[styles.title, { fontSize: 36 * scale }]}>CALENDARIO</Text>

      {/* Status filter */}
      <View style={styles.filterRow}>
        {STATUSES.map((s, i) => (
          <Pressable
            key={s.key}
            style={({ focused }) => [styles.filterBtn, statusFilter === s.key && styles.filterBtnActive, focused && styles.filterBtnFocused]}
            onPress={() => setStatusFilter(s.key)}
            {...(isTV && i === 0 ? { hasTVPreferredFocus: true } : {})}
          >
            <Text style={[styles.filterLabel, statusFilter === s.key && styles.filterLabelActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Group filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll} nestedScrollEnabled>
        <View style={styles.filterRow}>
          <Pressable
            style={({ focused }) => [styles.groupBtn, groupFilter === 'all' && styles.groupBtnActive, focused && styles.groupBtnFocused]}
            onPress={() => setGroupFilter('all')}
          >
            <Text style={[styles.groupLabel, groupFilter === 'all' && styles.groupLabelActive]}>
              TODOS
            </Text>
          </Pressable>
          {allGroups.map((g) => (
            <Pressable
              key={g}
              style={({ focused }) => [styles.groupBtn, groupFilter === g && styles.groupBtnActive, focused && styles.groupBtnFocused]}
              onPress={() => setGroupFilter(g)}
            >
              <Text style={[styles.groupLabel, groupFilter === g && styles.groupLabelActive]}>
                GRUPO {g}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Team search */}
      <TextInput
        style={[styles.searchInput, searchFocused && styles.searchInputFocused]}
        placeholder="Buscar equipo..."
        placeholderTextColor={COLORS.dim}
        value={teamFilter}
        onChangeText={setTeamFilter}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
      />

      {loading ? (
        <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>
          {statusFilter === 'live'
            ? 'No hay partidos en vivo ahora'
            : 'No se encontraron partidos con esos filtros'}
        </Text>
      ) : (
        <View>
          {grouped.map(([day, dayMatches]) => (
            <View key={day} style={styles.dayBlock}>
              <Text style={styles.dayTitle}>{day.toUpperCase()}</Text>
              {dayMatches.map((m) => (
                <View key={m.id} style={[styles.matchRow, m.status === 'live' && styles.matchRowLive]}>
                  <View style={styles.matchTeams}>
                    <TeamFlag name={m.home_team} iso2={m.home_iso2} size={22} />
                    <Text style={[styles.matchText, m.status === 'live' && styles.liveText]} numberOfLines={1}>
                      {m.home_team}
                    </Text>
                    <Text style={styles.vs}>vs</Text>
                    <TeamFlag name={m.away_team} iso2={m.away_iso2} size={22} />
                    <Text style={[styles.matchText, m.status === 'live' && styles.liveText]} numberOfLines={1}>
                      {m.away_team}
                    </Text>
                  </View>
                  <View style={styles.matchInfoCol}>
                    <Text style={styles.matchMeta}>
                      {m.type === 'group'
                        ? `Grupo ${m.group}`
                        : m.type
                          ? m.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                          : `Grupo ${m.group}`}
                    </Text>
                    {m.matchday ? (
                      <Text style={styles.matchdayText}>Jornada {m.matchday}</Text>
                    ) : null}
                  </View>
                  <View style={styles.matchVenueCol}>
                    {m.stadium ? (
                      <Text style={styles.venueText} numberOfLines={1}>{m.stadium}</Text>
                    ) : null}
                    {m.stadium_city ? (
                      <Text style={styles.cityText}>{m.stadium_city}</Text>
                    ) : null}
                  </View>
                  <View style={styles.scoreCol}>
                    {m.status === 'finished' ? (
                      <View style={styles.scoreBlock}>
                        <Text style={styles.scoreFinished}>
                          {m.home_score} - {m.away_score}
                        </Text>
                        <Text style={styles.finalTag}>FINAL</Text>
                      </View>
                    ) : m.status === 'live' ? (
                      <View style={styles.scoreBlock}>
                        <Text style={styles.scoreLive}>
                          {m.home_score} - {m.away_score}
                        </Text>
                        <Text style={styles.liveTag}>
                          {m.time_elapsed && m.time_elapsed !== 'notstarted'
                            ? `${m.time_elapsed}'`
                            : 'EN VIVO'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.scoreBlock}>
                        <Text style={styles.scoreUpcoming}>
                          {matchTime(m.date)}
                        </Text>
                        <Text style={styles.dateText}>
                          {matchDate(m.date, { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  back: { color: COLORS.gold, fontWeight: 'bold', marginBottom: 10 },
  title: { color: COLORS.gold, fontWeight: 'bold', letterSpacing: 3, marginBottom: 15 },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: '#333' },
  filterBtnActive: { backgroundColor: COLORS.goldDim, borderColor: COLORS.gold },
  filterBtnFocused: { borderColor: COLORS.gold, borderWidth: 2 },
  filterLabel: { color: COLORS.dim, fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  filterLabelActive: { color: COLORS.gold },
  groupScroll: { marginBottom: 10 },
  groupBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: COLORS.panel, marginRight: 6 },
  groupBtnActive: { backgroundColor: COLORS.goldDim },
  groupBtnFocused: { borderColor: COLORS.gold, borderWidth: 1 },
  groupLabel: { color: COLORS.dim, fontSize: 12, fontWeight: '600' },
  groupLabelActive: { color: COLORS.gold },
  searchInput: {
    backgroundColor: COLORS.panel,
    color: COLORS.white,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  searchInputFocused: {
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  empty: { color: COLORS.dim, fontSize: 16, textAlign: 'center', marginTop: 60 },
  dayBlock: { marginBottom: 30 },
  dayTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold,
    paddingBottom: 8,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 4,
  },
  matchRowLive: {
    backgroundColor: 'rgba(255,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)',
  },
  matchTeams: { flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchInfoCol: { flex: 0.7, alignItems: 'center' },
  matchVenueCol: { flex: 0.8, alignItems: 'center' },
  matchText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  liveText: { color: COLORS.white },
  vs: { color: COLORS.dim, fontSize: 12, marginHorizontal: 2 },
  matchMeta: { color: COLORS.dim, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  matchdayText: { color: '#666', fontSize: 10, marginTop: 2 },
  venueText: { color: COLORS.white, fontSize: 11, fontWeight: '500' },
  cityText: { color: '#666', fontSize: 10, marginTop: 1 },
  scoreCol: { alignItems: 'flex-end', minWidth: 90 },
  scoreBlock: { alignItems: 'center' },
  scoreFinished: { color: COLORS.gold, fontSize: 20, fontWeight: '800' },
  scoreLive: { color: COLORS.live, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  liveTag: { color: COLORS.live, fontSize: 10, fontWeight: 'bold', textAlign: 'center', marginTop: 2 },
  finalTag: { color: COLORS.dim, fontSize: 9, fontWeight: '600', textAlign: 'center', marginTop: 2, letterSpacing: 1 },
  scoreUpcoming: { color: COLORS.dim, fontSize: 16, fontWeight: '600' },
  dateText: { color: '#666', fontSize: 10, marginTop: 2 },
});
