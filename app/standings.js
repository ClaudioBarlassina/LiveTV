import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Image, Platform, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import { fetchStandings, allGroups } from '../services/api';
import { COLORS } from '../constants/theme';

const GROUP_ORDER = allGroups;

export default function Standings() {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const isCompact = windowWidth < 800;
  const isTV = Platform.isTV;
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('all');

  useEffect(() => {
    fetchStandings().then((data) => {
      setGroups(data);
      setLoading(false);
    });
  }, []);

  const sorted = useMemo(() => {
    return [...groups].sort(
      (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)
    );
  }, [groups]);

  const visible = selectedGroup === 'all' ? sorted : sorted.filter((g) => g.group === selectedGroup);

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <Link href="/" style={styles.back}>← VOLVER</Link>
        <Text style={styles.title}>TABLAS</Text>
        <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 40 }} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { padding: isCompact ? 16 : 40 * scale }]}>
      <Link href="/" style={[styles.back, { fontSize: 18 * scale }]}>← VOLVER</Link>
      <Text style={[styles.title, { fontSize: 36 * scale }]}>TABLAS</Text>

      {/* Group navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupNav} nestedScrollEnabled>
        <Pressable
          style={[styles.navBtn, selectedGroup === 'all' && styles.navBtnActive]}
          onPress={() => setSelectedGroup('all')}
          {...(isTV ? { hasTVPreferredFocus: true } : {})}
        >
          <Text style={[styles.navLabel, selectedGroup === 'all' && styles.navLabelActive]}>
            TODOS
          </Text>
        </Pressable>
        {sorted.map((g) => (
          <Pressable
            key={g.group}
            style={[styles.navBtn, selectedGroup === g.group && styles.navBtnActive]}
            onPress={() => setSelectedGroup(g.group)}
          >
            <Text style={[styles.navLabel, selectedGroup === g.group && styles.navLabelActive]}>
              GRUPO {g.group}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View>
        {visible.map((group) => {
          const sortedTeams = [...group.teams].sort(
            (a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga)
          );

          return (
            <View key={group.group} style={styles.groupBlock}>
              <Text style={styles.groupTitle}>GRUPO {group.group}</Text>

              {/* Header */}
              <View style={styles.headerRow}>
                <Text style={[styles.headerCell, { width: 30 }]}>#</Text>
                <Text style={[styles.headerCell, styles.teamCell]}>EQUIPO</Text>
                <Text style={styles.headerCell}>PJ</Text>
                <Text style={styles.headerCell}>G</Text>
                <Text style={styles.headerCell}>E</Text>
                <Text style={styles.headerCell}>P</Text>
                <Text style={styles.headerCell}>GF</Text>
                <Text style={styles.headerCell}>GC</Text>
                <Text style={styles.headerCell}>DG</Text>
                <Text style={[styles.headerCell, styles.ptsCell]}>PTS</Text>
              </View>

              {sortedTeams.map((team, i) => (
                <View
                  key={team.name}
                  style={[styles.teamRow, i < 2 && styles.qualifyRow]}
                >
                  <Text style={[styles.cell, { width: 30 }]}>{team.rank}</Text>
                  <View style={styles.teamCellInner}>
                    {team.flag && <Image source={{ uri: team.flag }} style={styles.flagIcon} />}
                    <Text style={[styles.cell, styles.teamCell]}>
                      {team.name}
                    </Text>
                  </View>
                  <Text style={styles.cell}>{team.played}</Text>
                  <Text style={styles.cell}>{team.wins}</Text>
                  <Text style={styles.cell}>{team.draws}</Text>
                  <Text style={styles.cell}>{team.losses}</Text>
                  <Text style={styles.cell}>{team.gf}</Text>
                  <Text style={styles.cell}>{team.ga}</Text>
                  <Text
                    style={[
                      styles.cell,
                      { color: team.gf - team.ga > 0 ? '#4CAF50' : team.gf - team.ga < 0 ? '#f44336' : COLORS.white },
                    ]}
                  >
                    {team.gf - team.ga > 0 ? '+' : ''}{team.gf - team.ga}
                  </Text>
                  <Text style={[styles.cell, styles.ptsCell]}>{team.points}</Text>
                </View>
              ))}

              {/* Legend */}
              {selectedGroup === 'all' && (
                <Text style={styles.legend}>▸ Clasificación a octavos</Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  back: { color: COLORS.gold, fontWeight: 'bold', marginBottom: 10 },
  title: { color: COLORS.gold, fontWeight: 'bold', letterSpacing: 3, marginBottom: 15 },
  groupNav: { marginBottom: 10 },
  navBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: COLORS.panel, marginRight: 6, borderWidth: 1, borderColor: '#222' },
  navBtnActive: { backgroundColor: COLORS.goldDim, borderColor: COLORS.gold },
  navLabel: { color: COLORS.dim, fontSize: 13, fontWeight: '600' },
  navLabelActive: { color: COLORS.gold },
  groupBlock: { marginBottom: 20, backgroundColor: COLORS.panel, padding: 20, borderRadius: 12 },
  groupTitle: { color: COLORS.gold, fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  headerRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333', marginBottom: 4 },
  headerCell: { color: COLORS.dim, fontSize: 11, fontWeight: '600', width: 35, textAlign: 'center' },
  teamRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', alignItems: 'center' },
  qualifyRow: { backgroundColor: 'rgba(76,175,80,0.08)' },
  cell: { color: COLORS.white, fontSize: 13, width: 35, textAlign: 'center' },
  teamCell: { flex: 1, textAlign: 'left', paddingLeft: 6, fontWeight: '600', fontSize: 14 },
  ptsCell: { color: COLORS.gold, fontWeight: 'bold' },
  legend: { color: COLORS.dim, fontSize: 11, marginTop: 10, fontStyle: 'italic' },
  teamCellInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  flagIcon: { width: 20, height: 14, borderRadius: 2 },
});
