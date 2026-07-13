import { View, StyleSheet, Text, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { Spacing, FontSize } from '@/constants/theme';
import { sendOtp } from '@/api/auth.api';
import { changePhone } from '@/api/user.api';
import { useAuthStore } from '@/store/authStore';

export default function ChangePhoneScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  // No SMS gateway — the backend hands the code back so we can show it here.
  const [shownCode, setShownCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 9) {
      setError('Enter a valid Ghana phone number');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const { otp: code } = await sendOtp({
        phone: phoneNumber.trim(),
        purpose: 'REGISTRATION',
      });
      setShownCode(code ?? '');
      setOtp(code && code.length === 6 ? code : '');
      setStep('otp');
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Enter the complete 6-digit code');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const updated = await changePhone(phoneNumber.trim(), otp);
      setUser(updated);
      Alert.alert(
        'Phone Number Changed',
        'Your phone number has been updated. Use it next time you log in.'
      );
      router.back();
    } catch (err) {
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
        'Could not verify the code. Please try again.';
      setError(message);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        title="Change Phone Number"
        onBackPress={() =>
          step === 'otp' ? setStep('phone') : router.back()
        }
      />
      <KeyboardAvoidingWrapper>
        <View style={styles.content}>
          {step === 'phone' ? (
            <>
              <Input
                label="New Phone Number"
                placeholder="XX XXX XXXX"
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (error) setError('');
                }}
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={10}
                leftIcon="call-outline"
                error={error}
                hint="We will send an OTP to verify your new number"
              />
              <Button
                label="Send OTP"
                onPress={handleSendOtp}
                loading={loading}
                disabled={phoneNumber.length < 9}
              />
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Verify {phoneNumber.trim()}
              </Text>
              {!!shownCode && (
                <View
                  style={[
                    styles.demoBanner,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.demoText, { color: colors.mutedForeground }]}
                  >
                    SMS delivery isn't set up yet, so your code is shown here:
                  </Text>
                  <Text style={[styles.demoCode, { color: colors.gold }]}>
                    {shownCode}
                  </Text>
                </View>
              )}
              <OtpInput
                value={otp}
                onChange={setOtp}
                onComplete={handleVerify}
                error={error}
                containerStyle={styles.otpInput}
              />
              <Button
                label="Verify & Change Number"
                onPress={handleVerify}
                loading={loading}
                disabled={otp.length < 6}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.base },
  title: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.lg,
  },
  demoBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  demoText: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  demoCode: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  otpInput: { marginBottom: Spacing.xl },
});
