import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { checkSubscription } from '../services/subscription';
import { loadChannels } from '../constants/channels';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  const [checked, setChecked] = useState(false);
  const [valid, setValid] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      const result = await checkSubscription();
      setValid(result.valid);
      if (result.valid) await loadChannels();
      setChecked(true);
    })();
  }, []);

  useEffect(() => {
    if (!checked) return;
    const inActivate = segments[0] === 'activate';
    if (!valid && !inActivate) {
      router.replace('/activate');
    } else if (valid && inActivate) {
      router.replace('/');
    }
  }, [checked, valid, segments]);

  // Re-check when navigating (catches activation returning to home)
  useEffect(() => {
    if (!checked) return;
    if (segments[0] !== 'activate') {
      checkSubscription().then((r) => {
        setValid(r.valid);
        if (r.valid) loadChannels();
      });
    }
  }, [segments]);

  if (!checked) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" hidden />
        <Text style={styles.loadingTitle}>DashTV</Text>
        <ActivityIndicator color={COLORS.gold} size="large" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <View style={styles.safeArea}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.bg },
            animation: 'none',
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  safeArea: {
    flex: 1,
    // Overscan padding for TV (Android TV often clips 5-10% off edges)
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 10,
    paddingRight: 10,
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    color: COLORS.gold,
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
});
