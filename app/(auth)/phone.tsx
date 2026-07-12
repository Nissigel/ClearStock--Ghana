import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { sendOtp } from '@/api/auth.api';
import { Spacing, FontSize, Radius } from '@/constants/theme';

export default function PhoneEntryScreen() {
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
      await sendOtp({
        phone: phoneNumber,
        purpose: 'REGISTRATION',
      });
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phoneNumber,
          purpose: 'REGISTRATION',
        },
      });
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingWrapper
        containerStyle={{ backgroundColor: colors.background }}
      >
        {/* TOP — Green section */}
        <View style={[styles.topSection, { backgroundColor: colors.background }]}>
          {/* Logo icon */}
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.logoIcon,
                { backgroundColor: colors.primaryDark },
              ]}
            >
              <Text style={styles.logoPercent}>%</Text>
              <Text style={styles.logoArrow}>↓</Text>
            </View>
          </View>

          {/* App name -->*/}
          <Text style={[styles.appName, { color: colors.gold }]}>
            ClearStock
          </Text>
          <View
            style={[styles.divider, { backgroundColor: colors.gold }]}
          />
          <Text style={[styles.appRegion, { color: colors.gold }]}>
            GHANA
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Fast Deals on Stock That Can't Wait.
          </Text>
        </View>

        {/* BOTTOM — Form section */}
        <View
          style={[
            styles.bottomSection,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Heading */}
          <Text
            style={[styles.heading, { color: colors.foreground }]}
          >
            Enter your phone number
          </Text>
          <Text
            style={[styles.subheading, { color: colors.mutedForeground }]}
          >
            We will send a 6-digit OTP to verify
          </Text>

          {/* Phone input */}
          <View style={styles.inputWrapper}>
            <View
              style={[
                styles.prefixContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: error ? colors.destructive : colors.input,
                  borderRadius: Radius.md,
                },
              ]}
            >
              <Text style={styles.flagEmoji}>🇬🇭</Text>
              <Text
                style={[
                  styles.prefix,
                  { color: colors.foreground },
                ]}
              >
                +233
              </Text>
              <View
                style={[
                  styles.prefixDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <Input
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  if (error) setError('');
                }}
                placeholder="XX XXX XXXX"
                keyboardType="phone-pad"
                autoCapitalize="none"
                maxLength={10}
                containerStyle={styles.phoneInput}
                error={error}
              />
            </View>
          </View>

          {/* Hint */}
          <Text
            style={[
              styles.hint,
              { color: colors.mutedForeground },
            ]}
          >
            Enter your number without the country code
          </Text>

          {/* Send OTP button */}
          <Button
            label="Send OTP"
            onPress={handleSendOtp}
            loading={loading}
            style={styles.button}
          />

          {/* Divider */}
          <View style={styles.orContainer}>
            <View
              style={[styles.orLine, { backgroundColor: colors.border }]}
            />
            <Text
              style={[
                styles.orText,
                { color: colors.mutedForeground },
              ]}
            >
              or
            </Text>
            <View
              style={[styles.orLine, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Login link */}
          <View style={styles.loginContainer}>
            <Text
              style={[
                styles.loginText,
                { color: colors.mutedForeground },
              ]}
            >
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleLoginPress}>
              <Text
                style={[
                  styles.loginLink,
                  { color: colors.primary },
                ]}
              >
                Login with PIN
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text
            style={[
              styles.terms,
              { color: colors.mutedForeground },
            ]}
          >
            By continuing you agree to our{' '}
            <Text style={{ color: colors.primary }}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={{ color: colors.primary }}>
              Privacy Policy
            </Text>
          </Text>
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
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0af3b',
  },
  logoPercent: {
    fontSize: 14,
    color: '#e0af3b',
    fontWeight: 'bold',
    position: 'absolute',
    top: 12,
    right: 14,
  },
  logoArrow: {
    fontSize: 28,
    color: '#e0af3b',
    fontWeight: 'bold',
    marginTop: 8,
  },
  appName: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  divider: {
    width: 80,
    height: 0.8,
    opacity: 0.4,
    marginVertical: Spacing.xs,
  },
  appRegion: {
    fontSize: FontSize.xs,
    letterSpacing: 5,
    opacity: 0.85,
    marginBottom: Spacing.md,
  },
  tagline: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic',
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
  inputWrapper: {
    marginBottom: Spacing.xs,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingLeft: Spacing.md,
    minHeight: 52,
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: Spacing.xs,
  },
  prefix: {
    fontSize: FontSize.base,
    fontWeight: '500',
    marginRight: Spacing.sm,
  },
  prefixDivider: {
    width: 1,
    height: 24,
    marginRight: Spacing.sm,
  },
  phoneInput: {
    flex: 1,
    marginBottom: 0,
  },
  hint: {
    fontSize: FontSize.xs,
    marginBottom: Spacing.xl,
    marginTop: Spacing.xs,
  },
  button: {
    marginBottom: Spacing.lg,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: FontSize.sm,
    marginHorizontal: Spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  loginText: {
    fontSize: FontSize.sm,
  },
  loginLink: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
  terms: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});