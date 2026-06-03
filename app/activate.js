import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { activateCode } from '../services/subscription';
import { loadChannels } from '../constants/channels';
import { COLORS } from '../constants/theme';

export default function Activate() {
  const { width: windowWidth } = useWindowDimensions();
  const scale = Math.min(1, Math.max(0.65, windowWidth / 1920));
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const router = useRouter();

  const handleActivate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    const data = await activateCode(code.trim().toUpperCase());
    setResult(data);
    if (data.success) {
      await loadChannels(true);
    }
    setLoading(false);
  };

  const isTV = Platform.isTV;

  return (
    <View style={[styles.container, { padding: 60 * scale }]}>
      <Text style={[styles.title, { fontSize: 48 * scale }]}>DashTV</Text>
      <Text style={[styles.subtitle, { fontSize: 18 * scale, marginBottom: 40 * scale }]}>Ingresá tu código de activación</Text>

      <TextInput
        style={[styles.input, { padding: 18 * scale, fontSize: 28 * scale }]}
        value={code}
        onChangeText={setCode}
        placeholder="WC26-XXXX-XXXX"
        placeholderTextColor="#555"
        autoCapitalize="characters"
        autoFocus={!isTV}
      />

      <Pressable
        style={[styles.btn, !code.trim() && styles.btnDisabled, { paddingVertical: 16 * scale, paddingHorizontal: 60 * scale, borderRadius: 10 * scale, marginBottom: 30 * scale }]}
        onPress={handleActivate}
        disabled={loading || !code.trim()}
        {...(isTV ? { hasTVPreferredFocus: true } : {})}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={[styles.btnText, { fontSize: 18 * scale }]}>ACTIVAR</Text>
        )}
      </Pressable>

      {result && (
        <View style={[styles.resultBox, result.success ? styles.resultSuccess : styles.resultError, { padding: 20 * scale, borderRadius: 10 * scale, marginBottom: 30 * scale }]}>
          <Text style={[styles.resultText, result.success ? styles.resultSuccessText : styles.resultErrorText, { fontSize: 16 * scale }]}>
            {result.success
              ? '✔ Suscripción activada correctamente'
              : `✘ ${result.error || 'Error al activar el código'}`}
          </Text>
          {result.success && result.expiresAt && (
            <Text style={[styles.expiryText, { fontSize: 13 * scale }]}>
              Válido hasta: {new Date(result.expiresAt).toLocaleDateString('es-AR')}
            </Text>
          )}
          {result.success && (
            <Pressable style={[styles.goBtn, { marginTop: 16 * scale, paddingVertical: 10 * scale, paddingHorizontal: 30 * scale, borderRadius: 8 * scale }]} onPress={() => router.replace('/')}>
              <Text style={[styles.goBtnText, { fontSize: 14 * scale }]}>IR AL INICIO</Text>
            </Pressable>
          )}
        </View>
      )}

      <Text style={[styles.hint, { fontSize: 12 * scale }]}>
        Ingresá el código que te proporcionó el administrador.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.gold,
    fontWeight: 'bold',
    letterSpacing: 6,
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.dim,
  },
  input: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 4,
    fontFamily: 'monospace',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: COLORS.gold,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    color: '#000',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  resultBox: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  resultSuccess: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  resultError: {
    backgroundColor: 'rgba(204,51,51,0.15)',
    borderWidth: 1,
    borderColor: '#CC3333',
  },
  resultText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  resultSuccessText: {
    color: '#4CAF50',
  },
  resultErrorText: {
    color: '#FF4444',
  },
  expiryText: {
    color: COLORS.dim,
    marginTop: 8,
  },
  goBtn: {
    backgroundColor: COLORS.gold,
  },
  goBtnText: {
    color: '#000',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hint: {
    color: COLORS.dim,
    textAlign: 'center',
    maxWidth: 400,
  },
});
