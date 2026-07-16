import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { OtpInput } from '@/components/ui/OtpInput';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { verifyOtp, sendOtp } from '@/api/auth.api';
import { Spacing, FontSize } from '@/constants/theme';
import { OTP_RESEND_COOLDOWN_SECONDS } from '@/constants/app';
import type { OtpPurpose } from '@/types/auth.types';

export default function OtpVerifyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { phoneNumber, purpose, devOtp, email } = useLocalSearchParams<{
    phoneNumber: string;
    purpose: OtpPurpose;
    devOtp?: string;
    email?: string;
  }>();

  // No SMS gateway is configured, so the backend hands the code back in the
  // send-otp response. Surface it here (and prefill it) so the flow works with
  // any real number until an SMS provider is wired up.
  const [shownCode, setShownCode] = useState(devOtp ?? '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(OTP_RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Prefill the code the backend returned so the user can just tap Verify.
  useEffect(() => {
    if (shownCode && shownCode.length === 6) {
      setOtp(shownCode);
    }
  }, [shownCode]);

  const handleVerify = async (code: string) => {
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    try {
      setLoading(true);
      setError('');
      if (purpose === 'PIN_RESET') {
        // Backend's reset-pin endpoint re-verifies the phone + otp itself
        // (it has no concept of a tempToken), so skip verify-otp here and
        // just carry the code the user entered forward.
        router.push({
          pathname: '/(auth)/reset-pin-new',
          params: { otp: code, phoneNumber },
        });
      } else {
        const { userExists, tempToken } = await verifyOtp({
          phone: phoneNumber,
          otp: code,
          purpose: purpose ?? 'REGISTRATION',
        });

        // This phone already has an account — the backend gives no tempToken,
        // so send them to log in rather than into a PIN screen that would fail.
        if (userExists || !tempToken) {
          Alert.alert(
            'Account already exists',
            'This number is already registered. Please log in with your PIN instead.',
            [
              {
                text: 'Log in',
                onPress: () =>
                  router.replace({
                    pathname: '/(auth)/login',
                    params: { phoneNumber },
                  }),
              },
            ]
          );
          return;
        }

        router.push({
          pathname: '/(auth)/create-pin',
          params: { tempToken, phoneNumber, email: email ?? '' },
        });
      }
    } catch (err) {
      setError('Invalid OTP. Please check and try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);
      const { otp: newCode } = await sendOtp({
        phone: phoneNumber,
        purpose: purpose ?? 'REGISTRATION',
        email: email || undefined,
      });
      setCountdown(OTP_RESEND_COOLDOWN_SECONDS);
      setCanResend(false);
      setOtp('');
      setError('');
      setShownCode(newCode ?? '');
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const maskedPhone = phoneNumber
    ? `${phoneNumber.slice(0, 6)}****${phoneNumber.slice(-2)}`
    : '';

 return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* TOP — Green section */}
        <View style={[styles.topSection, { backgroundColor: colors.background }]}>
          <ScreenHeader
            showBack
            transparent
            containerStyle={styles.header}
          />
          <Text style={[styles.topTitle, { color: colors.gold }]}>
            Verify your number
          </Text>
          <Text style={[styles.topSubtitle, { color: colors.mutedForeground }]}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={[styles.phoneDisplay, { color: colors.gold }]}>
            {maskedPhone}
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
            Enter OTP code
          </Text>
          <Text
            style={[styles.subheading, { color: colors.mutedForeground }]}
          >
            The code expires in 2 minutes
          </Text>

          {!!shownCode && (
            <View
              style={[
                styles.demoBanner,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.demoText, { color: colors.mutedForeground }]}>
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
            label="Verify OTP"
            onPress={() => handleVerify(otp)}
            loading={loading}
            disabled={otp.length < 6}
            style={styles.button}
          />

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity
                onPress={handleResend}
                disabled={resendLoading}
              >
                <Text
                  style={[
                    styles.resendLink,
                    { color: colors.primary },
                  ]}
                >
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={[
                  styles.resendText,
                  { color: colors.mutedForeground },
                ]}
              >
                Resend OTP in{' '}
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>
                  {countdown}s
                </Text>
              </Text>
            )}
          </View>
        </View>
     </ScrollView>
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
  otpInput: {
    marginBottom: Spacing.xl,
  },
  button: {
    marginBottom: Spacing.lg,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: FontSize.sm,
  },
resendLink: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
  phoneDisplay: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginTop: Spacing.xs,
  },
});