import { View, Text, StyleSheet, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { COLORS } from '../constants/theme';

const TABS = [
  { href: '/', label: 'EN VIVO' },
  { href: '/fixtures', label: 'CALENDARIO' },
  { href: '/knockout', label: 'ELIMINATORIAS' },
  { href: '/standings', label: 'TABLAS' },
];

export default function NavBar() {
  const pathname = usePathname();
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const isCompact = windowWidth < 800;
  const isTV = Platform.isTV;

  return (
    <View style={[styles.container, { paddingHorizontal: 40 * scale }]}>
      <Text style={[styles.logo, { fontSize: 20 * scale, marginRight: 50 * scale }]}>DashTV</Text>
      {isCompact ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {TABS.map((tab, i) => {
            const isActive = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href} style={[styles.tab, isActive && styles.tabActive, { paddingHorizontal: 12, paddingVertical: 8 }]} {...(isTV && i === 0 ? { hasTVPreferredFocus: true } : {})}>
                <Text style={[styles.tabText, isActive && styles.tabTextActive, { fontSize: 13 }]}>
                  {tab.label}
                </Text>
              </Link>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.tabs}>
          {TABS.map((tab, i) => {
            const isActive = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href} style={[styles.tab, isActive && styles.tabActive, { paddingHorizontal: 25 * scale, paddingVertical: 8 * scale }]} {...(isTV && i === 0 ? { hasTVPreferredFocus: true } : {})}>
                <Text style={[styles.tabText, isActive && styles.tabTextActive, { fontSize: 16 * scale }]}>
                  {tab.label}
                </Text>
              </Link>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: COLORS.panel,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 100,
  },
  logo: {
    color: COLORS.gold,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  tabsScroll: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    gap: 5,
  },
  tab: {
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: COLORS.goldDim,
  },
  tabText: {
    color: COLORS.dim,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.gold,
  },
});
