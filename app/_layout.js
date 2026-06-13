import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { checkSubscription } from '../services/subscription';
import { loadChannels } from '../constants/channels';
import { COLORS } from '../constants/theme';
import Logo from '../components/Logo';

export default function RootLayout() {
  const [checked, setChecked] = useState(false);
  const [valid, setValid] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      const result = await checkSubscription();
      setValid(result.valid);
      await loadChannels();
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
      checkSubscription().then(async (r) => {
        setValid(r.valid);
        await loadChannels(true);
      });
    }
  }, [segments]);

  if (!checked) {
    return (
      <View style={styles.loading}>
        <StatusBar style="light" hidden />
        <Logo size={36} />
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
  },
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
