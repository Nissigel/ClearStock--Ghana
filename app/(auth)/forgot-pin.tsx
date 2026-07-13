import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { sendOtp } from '@/api/auth.api';
import { Spacing, FontSize } from '@/constants/theme';

export default function ForgotPinScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (phoneNumber.replace(/\s/g, '').length < 9) {
      setError('Enter a valid Ghana phone number');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const { otp } = await sendOtp({
        phone: phoneNumber,
        purpose: 'PIN_RESET',
      });
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phoneNumber,
          purpose: 'PIN_RESET',
          // Null when it was emailed to the account instead of returned here.
          devOtp: otp ?? '',
        },
      });
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
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
            Forgot your PIN?
          </Text>
          <Text
            style={[
              styles.topSubtitle,
              { color: colors.mutedForeground },
            ]}
          >
            No worries. We will help you reset it.
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
            Enter your phone number
          </Text>
          <Text
            style={[styles.subheading, { color: colors.mutedForeground }]}
          >
            We will send an OTP to verify it is you
          </Text>

          <Input
            label="Phone Number"
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
          />

          <Button
            label="Send OTP"
            onPress={handleSendOtp}
            loading={loading}
            disabled={phoneNumber.length < 9}
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
  button: {
    marginBottom: Spacing.lg,
  },
});