import { View, Text, StyleSheet, ScrollView, Platform, useWindowDimensions, Pressable } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';
import Logo from './Logo';

const TABS = [
  { href: '/', label: 'EN VIVO' },
  { href: '/fixtures', label: 'CALENDARIO' },
  { href: '/knockout', label: 'ELIMINATORIAS' },
  { href: '/standings', label: 'TABLAS' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const isCompact = windowWidth < 800;
  const isMobile = windowWidth < 500;

  return (
    <View style={[styles.container, { paddingHorizontal: isMobile ? 8 : 40 * scale }]}>
      <Logo size={isMobile ? 12 : 20 * scale} />
      {isCompact ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {TABS.map((tab, i) => {
            const isActive = pathname === tab.href;
            return (
              <Pressable
                key={tab.href}
                onPress={() => router.push(tab.href)}
                style={({ pressed, focused }) => [
                  styles.tab,
                  isActive && styles.tabActive,
                  (pressed || focused) && styles.tabFocused,
                  { paddingHorizontal: isMobile ? 7 : 10, paddingVertical: 4 }
                ]}
                {...(Platform.isTV && i === 0 ? { hasTVPreferredFocus: true } : {})}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive, { fontSize: 12 }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.tabs}>
          {TABS.map((tab, i) => {
            const isActive = pathname === tab.href;
            return (
              <Pressable
                key={tab.href}
                onPress={() => router.push(tab.href)}
                style={({ pressed, focused }) => [
                  styles.tab,
                  isActive && styles.tabActive,
                  (pressed || focused) && styles.tabFocused,
                  { paddingHorizontal: 18 * scale, paddingVertical: 5 * scale }
                ]}
                {...(Platform.isTV && i === 0 ? { hasTVPreferredFocus: true } : {})}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive, { fontSize: 14 * scale }]}>
                  {tab.label}
                </Text>
              </Pressable>
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
  tabsScroll: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    gap: 16,
  },
  tab: {
    borderRadius: 20,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    alignSelf: 'flex-start',
  },
  tabActive: {
    backgroundColor: COLORS.goldDim,
    borderColor: COLORS.gold,
  },
  tabFocused: {
    borderWidth: 2,
    borderColor: COLORS.gold,
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
