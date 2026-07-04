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
import { resetPin } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { Spacing, FontSize } from '@/constants/theme';
import { PIN_LENGTH } from '@/constants/app';

export default function ResetPinNewScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { resetToken, phoneNumber } = useLocalSearchParams<{
    resetToken: string;
    phoneNumber: string;
  }>();

  const setAuth = useAuthStore((state) => state.setAuth);
  const setHasSellerProfile = useModeStore(
    (state) => state.setHasSellerProfile
  );

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'new' | 'confirm'>('new');

  const handleNewPinNext = () => {
    if (pin.length < PIN_LENGTH) {
      setPinError(`PIN must be ${PIN_LENGTH} digits`);
      return;
    }
    setPinError('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (confirmPin.length < PIN_LENGTH) {
      setConfirmError(`PIN must be ${PIN_LENGTH} digits`);
      return;
    }
    if (confirmPin !== pin) {
      setConfirmError('PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }
    try {
      setLoading(true);
      setConfirmError('');
      const authResponse = await resetPin({
        resetToken,
        newPin: confirmPin,
      });
      setAuth(
        authResponse.user,
        authResponse.token,
        authResponse.refreshToken
      );
      setHasSellerProfile(authResponse.user.hasSellerProfile);
      router.replace('/(buyer)/home');
    } catch (err) {
      setConfirmError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.primary }]}
    >
      <KeyboardAvoidingWrapper
        containerStyle={{ backgroundColor: colors.background }}
      >
        {/* TOP — Green section */}
        <View
          style={[styles.topSection, { backgroundColor: colors.primary }]}
        >
          <ScreenHeader
            showBack
            transparent
            containerStyle={styles.header}
            onBackPress={
              step === 'confirm' ? () => setStep('new') : undefined
            }
          />
          <Text style={[styles.topTitle, { color: colors.gold }]}>
            {step === 'new' ? 'Create new PIN' : 'Confirm new PIN'}
          </Text>
          <Text
            style={[
              styles.topSubtitle,
              { color: colors.primaryForeground },
            ]}
          >
            {step === 'new'
              ? 'Choose a new 4-digit PIN for your account'
              : 'Enter your new PIN one more time'}
          </Text>
        </View>

        {/* BOTTOM — Form section */}
        <View
          style={[
            styles.bottomSection,
            { backgroundColor: colors.background },
          ]}
        >
          {step === 'new' ? (
            <>
              <Text
                style={[styles.heading, { color: colors.foreground }]}
              >
                New PIN
              </Text>
              <Text
                style={[
                  styles.subheading,
                  { color: colors.mutedForeground },
                ]}
              >
                This will replace your old PIN
              </Text>
              <PinInput
                value={pin}
                onChange={(value) => {
                  setPin(value);
                  if (pinError) setPinError('');
                }}
                error={pinError}
                containerStyle={styles.pinInput}
              />
              <Button
                label="Next"
                onPress={handleNewPinNext}
                disabled={pin.length < PIN_LENGTH}
                style={styles.button}
              />
            </>
          ) : (
            <>
              <Text
                style={[styles.heading, { color: colors.foreground }]}
              >
                Confirm new PIN
              </Text>
              <Text
                style={[
                  styles.subheading,
                  { color: colors.mutedForeground },
                ]}
              >
                Make sure it matches your new PIN
              </Text>
              <PinInput
                value={confirmPin}
                onChange={(value) => {
                  setConfirmPin(value);
                  if (confirmError) setConfirmError('');
                }}
                error={confirmError}
                containerStyle={styles.pinInput}
              />
              <Button
                label="Reset PIN"
                onPress={handleConfirm}
                loading={loading}
                disabled={confirmPin.length < PIN_LENGTH}
                style={styles.button}
              />
            </>
          )}
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