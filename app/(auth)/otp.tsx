import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  const { phoneNumber, purpose } = useLocalSearchParams<{
    phoneNumber: string;
    purpose: OtpPurpose;
  }>();

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

  const handleVerify = async (code: string) => {
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const tempToken = await verifyOtp({
        phoneNumber,
        otp: code,
        purpose: purpose ?? 'REGISTRATION',
      });

      if (purpose === 'PIN_RESET') {
        router.push({
          pathname: '/(auth)/reset-pin-new',
          params: { resetToken: tempToken, phoneNumber },
        });
      } else {
        router.push({
          pathname: '/(auth)/create-pin',
          params: { tempToken, phoneNumber },
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
      await sendOtp({
        phoneNumber,
        purpose: purpose ?? 'REGISTRATION',
      });
      setCountdown(OTP_RESEND_COOLDOWN_SECONDS);
      setCanResend(false);
      setOtp('');
      setError('');
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
      style={[styles.safeArea, { backgroundColor: colors.primary }]}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background }}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* TOP — Green section */}
        <View style={[styles.topSection, { backgroundColor: colors.primary }]}>
          <ScreenHeader
            showBack
            transparent
            containerStyle={styles.header}
          />
          <Text style={[styles.topTitle, { color: colors.gold }]}>
            Verify your number
          </Text>
          <Text style={[styles.topSubtitle, { color: colors.primaryForeground }]}>
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