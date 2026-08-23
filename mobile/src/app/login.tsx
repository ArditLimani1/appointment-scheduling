import * as Device from 'expo-device';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from 'react-native';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/store';
import { Screen } from '@/components/Screen';
import { Button, TextField } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, spacing, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const { t } = useT();
  const signIn = useAuth((s) => s.signIn);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password, Device.deviceName ?? 'mobile');
    } catch (e) {
      if (e instanceof ApiError) {
        setFieldErrors(e.errors ?? {});
        setError(e.message);
      } else {
        setError(t('mobile.login.error_generic'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: spacing.xs }}>
            <Text style={[typography.displaySmall as TextStyle, { color: palette.onSurface }]}>
              {t('mobile.login.title')}
            </Text>
            <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>
              {t('mobile.login.subtitle')}
            </Text>
          </View>

          <View style={{ gap: spacing.lg }}>
            <TextField
              label={t('mobile.login.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              error={fieldErrors.email?.[0]}
            />
            <TextField
              label={t('mobile.login.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              error={fieldErrors.password?.[0]}
            />
            {error && !fieldErrors.email && !fieldErrors.password ? (
              <Text style={[typography.label as TextStyle, { color: palette.error }]}>{error}</Text>
            ) : null}
            <Button title={t('mobile.login.submit')} onPress={() => void submit()} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
});
