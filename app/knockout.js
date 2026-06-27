import { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated, useWindowDimensions } from 'react-native';
import { Link } from 'expo-router';
import Svg, { Line } from 'react-native-svg';
import { fetchLiveMatches } from '../services/api';
import { matchTime, matchDate } from '../services/dates';
import NavBar from '../components/NavBar';
import TeamFlag from '../components/TeamFlag';
import { COLORS } from '../constants/theme';

const ROUND_LABELS = { r32: '32AVOS', r16: 'OCTAVOS', qf: 'CUARTOS', sf: 'SEMIS', final: 'FINAL', third: '3ER PUESTO' };
const MAIN_ROUNDS = ['r32', 'r16', 'qf', 'sf', 'final'];
const BASE_SLOT = 45;
const SVG_W = 22;
const CARD_H = 36;

/* ───────── pulse animation ───────── */

function LivePulse() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    a.start();
    return () => a.stop();
  }, [anim]);
  return anim;
}

/* ───────── compact bracket card ───────── */

function BracketCard({ match }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isUpcoming = match.status === 'upcoming';
  const pulse = isLive ? LivePulse() : null;
  const ht = !match.home_team_id || match.home_team_id === '0';
  const at = !match.away_team_id || match.away_team_id === '0';

  const badgeText = isLive ? 'VIVO' : isFinished ? 'FIN' : isUpcoming && match.date ? matchTime(match.date) : '—';

  return (
    <Animated.View style={[
      s.card,
      isLive && { borderColor: COLORS.live, borderWidth: 2, opacity: pulse },
      isFinished && { borderColor: COLORS.gold, borderWidth: 1 },
      isUpcoming && { borderColor: '#222', borderWidth: 1 },
    ]}>
      <View style={s.cardBody}>
        <View style={s.cardRow}>
          {!ht && <TeamFlag name={match.home_team} iso2={match.home_iso2} size={12} />}
          <Text style={[s.tname, ht && s.tbd]} numberOfLines={1}>{ht ? '?' : match.home_team}</Text>
          {!isUpcoming && <Text style={[s.scr, isLive && { color: COLORS.live }, isFinished && { color: COLORS.gold }]}>{match.home_score}</Text>}
        </View>
        <View style={s.cardRow}>
          {!at && <TeamFlag name={match.away_team} iso2={match.away_iso2} size={12} />}
          <Text style={[s.tname, at && s.tbd]} numberOfLines={1}>{at ? '?' : match.away_team}</Text>
          {!isUpcoming && <Text style={[s.scr, isLive && { color: COLORS.live }, isFinished && { color: COLORS.gold }]}>{match.away_score}</Text>}
        </View>
      </View>
      <View style={[s.badge, isLive && { backgroundColor: COLORS.live }, isFinished && { backgroundColor: 'rgba(212,175,55,0.15)' }, isUpcoming && { backgroundColor: '#1a1a1a' }]}>
        <Text style={[s.badgeTxt, isLive && { color: '#fff' }, isFinished && { color: COLORS.gold }, isUpcoming && { color: COLORS.dim }]}>{badgeText}</Text>
      </View>
    </Animated.View>
  );
}

/* ───────── round column ───────── */

function RoundColumn({ round, totalSlots, colW }) {
  const totalH = totalSlots * BASE_SLOT;
  return (
    <View style={{ width: colW }}>
      <Text style={[s.rLabel, { fontSize: 10 }]}>{ROUND_LABELS[round.key] || round.key.toUpperCase()}</Text>
      <View style={{ height: totalH, position: 'relative' }}>
        {round.matches.map((m, j) => {
          const slotH = round.span * BASE_SLOT;
          return (
            <View key={m.id} style={{ position: 'absolute', top: j * slotH, left: 0, right: 0, height: slotH, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2 }}>
              <BracketCard match={m} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ───────── SVG connector lines ───────── */

function ConnectorSVG({ numPairs, fromSpan, totalSlots, reverse, single }) {
  const totalH = totalSlots * BASE_SLOT;
  const mX = SVG_W * 0.35;

  if (single) {
    const yC = (totalSlots / 2) * BASE_SLOT;
    return (
      <Svg width={SVG_W} height={totalH}>
        <Line x1={reverse ? SVG_W : 0} y1={yC} x2={reverse ? 0 : SVG_W} y2={yC} stroke="#666" strokeWidth={2} />
      </Svg>
    );
  }

  const x1 = reverse ? SVG_W : 0;
  const x2 = reverse ? 0 : SVG_W;

  return (
    <Svg width={SVG_W} height={totalH}>
      {Array.from({ length: numPairs }).map((_, i) => {
        const y1 = (2 * i + 0.5) * fromSpan * BASE_SLOT;
        const y2 = (2 * i + 1.5) * fromSpan * BASE_SLOT;
        const yM = (i + 0.5) * 2 * fromSpan * BASE_SLOT;
        return (
          <React.Fragment key={i}>
            <Line x1={x1} y1={y1} x2={mX} y2={y1} stroke="#444" strokeWidth={1.5} />
            <Line x1={x1} y1={y2} x2={mX} y2={y2} stroke="#444" strokeWidth={1.5} />
            <Line x1={mX} y1={y1} x2={mX} y2={y2} stroke="#444" strokeWidth={1.5} />
            <Line x1={mX} y1={yM} x2={x2} y2={yM} stroke="#555" strokeWidth={2} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

/* ───────── fallback list for narrow screens ───────── */

function FallbackList({ leftRounds, rightRounds, finalMatches, thirdMatch }) {
  const all = [];
  for (const r of leftRounds) {
    for (const m of r.matches) all.push({ ...m, _label: ROUND_LABELS[r.key] });
  }
  for (const m of finalMatches) all.push({ ...m, _label: ROUND_LABELS.final });
  for (const r of rightRounds) {
    for (const m of r.matches) all.push({ ...m, _label: ROUND_LABELS[r.key] });
  }
  const grouped = {};
  for (const m of all) {
    if (!grouped[m._label]) grouped[m._label] = [];
    grouped[m._label].push(m);
  }

  return (
    <ScrollView>
      <View style={{ gap: 16 }}>
        {Object.entries(grouped).map(([label, ms]) => (
          <View key={label}>
            <Text style={s.fbTitle}>{label}</Text>
            <View style={{ gap: 4 }}>
              {ms.map((m) => (
                <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.panel, padding: 6, borderRadius: 6 }}>
                  <Text style={{ color: COLORS.white, flex: 1, fontSize: 12 }} numberOfLines={1}>
                    {m.home_team_id && m.home_team_id !== '0' ? m.home_team : '?'}
                  </Text>
                  <Text style={{ color: m.status === 'live' ? COLORS.live : COLORS.gold, fontWeight: '800', fontSize: 13 }}>
                    {m.status !== 'upcoming' ? `${m.home_score}-${m.away_score}` : 'vs'}
                  </Text>
                  <Text style={{ color: COLORS.white, flex: 1, textAlign: 'right', fontSize: 12 }} numberOfLines={1}>
                    {m.away_team_id && m.away_team_id !== '0' ? m.away_team : '?'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        {thirdMatch && (
          <View>
            <Text style={s.fbTitle}>3ER PUESTO</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.panel, padding: 6, borderRadius: 6 }}>
              <Text style={{ color: COLORS.white, flex: 1, fontSize: 12 }}>{thirdMatch.home_team}</Text>
              <Text style={{ color: COLORS.gold, fontWeight: '800', fontSize: 13 }}>{thirdMatch.home_score}-{thirdMatch.away_score}</Text>
              <Text style={{ color: COLORS.white, flex: 1, textAlign: 'right', fontSize: 12 }}>{thirdMatch.away_team}</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/* ───────── third-place match card ───────── */

function ThirdPlaceMatch({ match }) {
  return (
    <View style={s.thirdRow}>
      <Text style={s.thirdLabel}>3ER PUESTO</Text>
      <View style={{ width: 160 }}>
        <BracketCard match={match} />
      </View>
    </View>
  );
}

/* ───────── main screen ───────── */

export default function Knockout() {
  const { width: w } = useWindowDimensions();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches().then((d) => { setMatches(d); setLoading(false); });
  }, []);

  const { leftRounds, rightRounds, finalMatches, thirdMatch, totalSlots } = useMemo(() => {
    const by = {};
    let third = null;
    for (const m of matches) {
      if (m.type === 'group') continue;
      if (m.type === 'third') { third = m; continue; }
      if (!by[m.type]) by[m.type] = [];
      by[m.type].push(m);
    }

    const present = MAIN_ROUNDS.filter((k) => k !== 'final' && by[k] && by[k].length > 0);
    const left = [];
    const right = [];

    for (let i = 0; i < present.length; i++) {
      const key = present[i];
      const all = by[key] || [];
      const mid = Math.ceil(all.length / 2);
      left.push({ key, matches: all.slice(0, mid), span: 1 << i });
      right.push({ key, matches: all.slice(mid), span: 1 << i });
    }

    const slots = Math.max(left[0]?.matches.length || 0, right[0]?.matches.length || 0, 1);

    return { leftRounds: left, rightRounds: right, finalMatches: by['final'] || [], thirdMatch: third, totalSlots: slots };
  }, [matches]);

  const bracketH = totalSlots * BASE_SLOT;
  const n = leftRounds.length;
  const totalCols = 2 * n + 1;
  const totalConns = 2 * n;
  const availW = w - 16;
  const colW = totalCols > 0 ? Math.max(100, (availW - totalConns * SVG_W) / totalCols) : 0;
  const showBracket = colW >= 110 && totalCols > 0;
  const rightRev = [...rightRounds].reverse();

  return (
    <View style={s.container}>
      <NavBar />
      <View style={{ flex: 1, padding: 5 }}>
        <Link href="/" style={s.back}>← VOLVER</Link>
        <Text style={s.title}>FASE ELIMINATORIA</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 40 }} />
        ) : !showBracket ? (
          <FallbackList leftRounds={leftRounds} rightRounds={rightRounds} finalMatches={finalMatches} thirdMatch={thirdMatch} />
        ) : (
          <ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
              {/* left side → center */}
              {leftRounds.map((r, i) => (
                <React.Fragment key={`l-${r.key}`}>
                  <RoundColumn round={r} totalSlots={totalSlots} colW={colW} />
                  <ConnectorSVG
                    numPairs={Math.floor(r.matches.length / 2)}
                    fromSpan={r.span}
                    totalSlots={totalSlots}
                    reverse={false}
                    single={r.matches.length === 1 && r.matches.length > 0}
                  />
                </React.Fragment>
              ))}

              {/* FINAL (centered) */}
              <RoundColumn
                round={{ key: 'final', matches: finalMatches, span: totalSlots }}
                totalSlots={totalSlots}
                colW={colW}
              />

              {/* center → right side (reversed) */}
              {rightRev.map((r, i) => (
                <React.Fragment key={`r-${r.key}`}>
                  <ConnectorSVG
                    numPairs={Math.floor(r.matches.length / 2)}
                    fromSpan={r.span}
                    totalSlots={totalSlots}
                    reverse={true}
                    single={r.matches.length === 1 && r.matches.length > 0}
                  />
                  <RoundColumn round={r} totalSlots={totalSlots} colW={colW} />
                </React.Fragment>
              ))}
            </View>

            {thirdMatch && <ThirdPlaceMatch match={thirdMatch} />}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

/* ───────── styles ───────── */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  back: { color: COLORS.gold, fontWeight: 'bold', marginBottom: 16, fontSize: 14 },
  title: { color: COLORS.gold, fontWeight: 'bold', letterSpacing: 3, marginBottom: 20, fontSize: 26 },
  rLabel: { color: COLORS.gold, fontWeight: '800', letterSpacing: 1, marginBottom: 6, textAlign: 'center' },
  thirdRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  thirdLabel: { color: COLORS.dim, fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  card: {
    backgroundColor: COLORS.panel,
    borderRadius: 5,
    width: '100%',
    overflow: 'hidden',
  },
  cardBody: { paddingHorizontal: 5, paddingTop: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', height: 13, gap: 2 },
  tname: { color: COLORS.white, fontSize: 10, fontWeight: '700', flexShrink: 1 },
  tbd: { color: COLORS.dim, fontStyle: 'italic' },
  scr: { color: COLORS.gold, fontSize: 10, fontWeight: '900', marginLeft: 'auto', minWidth: 12, textAlign: 'right' },
  badge: { marginTop: 1, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, alignSelf: 'center' },
  badgeTxt: { fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  fbTitle: { color: COLORS.white, fontWeight: 'bold', fontSize: 13, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.gold, paddingBottom: 4 },
});
