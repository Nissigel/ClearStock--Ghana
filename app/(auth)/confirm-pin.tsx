import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { PinInput } from '@/components/ui/PinInput';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { createPin } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { Spacing, FontSize } from '@/constants/theme';
import { PIN_LENGTH } from '@/constants/app';

export default function ConfirmPinScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { tempToken, phoneNumber, pin } = useLocalSearchParams<{
    tempToken: string;
    phoneNumber: string;
    pin: string;
  }>();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (confirmPin.length < PIN_LENGTH) {
      setError(`PIN must be ${PIN_LENGTH} digits`);
      return false;
    }
    if (confirmPin !== pin) {
      setError('PINs do not match. Please try again.');
      setConfirmPin('');
      return false;
    }
    setError('');
    return true;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const authResponse = await createPin({
        tempToken,
        pin: confirmPin,
      });
      setAuth(authResponse.user, authResponse.token);
      router.push({
        pathname: '/(auth)/profile-setup',
        params: { phoneNumber },
      });
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingWrapper
        containerStyle={{ backgroundColor: colors.background }}
      >
        {/* TOP — Green section */}
        <View
          style={[styles.topSection, { backgroundColor: colors.background }]}
        >
          <ScreenHeader
            showBack
            transparent
            containerStyle={styles.header}
          />
          <Text style={[styles.topTitle, { color: colors.gold }]}>
            Confirm your PIN
          </Text>
          <Text
            style={[
              styles.topSubtitle,
              { color: colors.mutedForeground },
            ]}
          >
            Enter your PIN one more time to confirm
          </Text>
        </View>

        {/* BOTTOM — Form section */}
        <View
          style={[
            styles.bottomSection,
            { backgroundColor: colors.background },
          ]}
        >
          <Text style={[styles.heading, { color: colors.foreground }]}>
            Re-enter your PIN
          </Text>
          <Text
            style={[styles.subheading, { color: colors.mutedForeground }]}
          >
            Make sure it matches the PIN you just created
          </Text>

          <PinInput
            value={confirmPin}
            onChange={(value) => {
              setConfirmPin(value);
              if (error) setError('');
            }}
            error={error}
            containerStyle={styles.pinInput}
          />

          <Button
            label="Confirm PIN"
            onPress={handleConfirm}
            loading={loading}
            disabled={confirmPin.length < PIN_LENGTH}
            style={styles.button}
          />
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topSection: {
    paddingBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
  },
  header: {
    borderBottomWidth: 0,
    paddingHorizontal: 0,
  },
  topTitle: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  topSubtitle: {
    fontSize: FontSize.sm,
    opacity: 0.85,
  },
  bottomSection: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  heading: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  subheading: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xl,
  },
  pinInput: {
    marginBottom: Spacing.xl,
  },
  button: {
    marginBottom: Spacing.lg,
  },
});