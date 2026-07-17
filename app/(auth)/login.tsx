import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { PinInput } from '@/components/ui/PinInput';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { login } from '@/api/auth.api';
import { useSlowRequestHint } from '@/hooks/useSlowRequestHint';
import { getSellerProfile } from '@/api/seller.api';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { Spacing, FontSize } from '@/constants/theme';
import { PIN_LENGTH } from '@/constants/app';

export default function LoginPinScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  // Prefilled when we redirect here from sign-up because the number already
  // has an account.
  const { phoneNumber: prefilledPhone } = useLocalSearchParams<{
    phoneNumber?: string;
  }>();

  const setAuth = useAuthStore((state) => state.setAuth);
  const setSellerProfile = useAuthStore((state) => state.setSellerProfile);
  const switchToSeller = useModeStore((state) => state.switchToSeller);

  const [phoneNumber, setPhoneNumber] = useState(prefilledPhone ?? '');
  const [pin, setPin] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSlow = useSlowRequestHint(loading);

  const validate = (): boolean => {
    let valid = true;
    if (!phoneNumber.trim()) {
      setPhoneError('Phone number is required');
      valid = false;
    } else {
      setPhoneError('');
    }
    if (pin.length < PIN_LENGTH) {
      setPinError(`PIN must be ${PIN_LENGTH} digits`);
      valid = false;
    } else {
      setPinError('');
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const authResponse = await login({
        phone: phoneNumber,
        pin,
      });
      setAuth(authResponse.user, authResponse.token);

      let sellerProfile = null;
      try {
        sellerProfile = await getSellerProfile();
      } catch {
        // A 404 (no seller profile) is handled inside getSellerProfile.
        // Any other failure here shouldn't block login — fall back to buyer.
        sellerProfile = null;
      }
      setSellerProfile(sellerProfile);

      if (sellerProfile) {
        switchToSeller();
        router.replace('/(seller)/(tabs)/dashboard');
      } else {
        router.replace('/(buyer)/(tabs)/home');
      }
    } catch (err) {
      setPinError('Incorrect phone number or PIN. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = () => {
    router.push('/(auth)/forgot-pin');
  };

  const handleRegister = () => {
    router.push('/(auth)/phone');
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
            Welcome back
          </Text>
          <Text
            style={[
              styles.topSubtitle,
              { color: colors.mutedForeground },
            ]}
          >
            Login to your ClearStock Ghana account
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
            Enter your details
          </Text>

          <Input
            label="Phone Number"
            placeholder="XX XXX XXXX"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (phoneError) setPhoneError('');
            }}
            keyboardType="phone-pad"
            autoCapitalize="none"
            maxLength={10}
            leftIcon="call-outline"
            error={phoneError}
          />

          <Text
            style={[styles.pinLabel, { color: colors.foreground }]}
          >
            PIN
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

          <TouchableOpacity
            onPress={handleForgotPin}
            style={styles.forgotPin}
          >
            <Text
              style={[styles.forgotPinText, { color: colors.primary }]}
            >
              Forgot PIN?
            </Text>
          </TouchableOpacity>

          <Button
            label="Login"
            onPress={handleLogin}
            loading={loading}
            disabled={
              phoneNumber.length < 9 || pin.length < PIN_LENGTH
            }
            style={styles.button}
          />

          {isSlow && (
            <Text style={[styles.slowHint, { color: colors.mutedForeground }]}>
              Waking up the server — this can take up to a minute the first time.
              Please hold on.
            </Text>
          )}

          <View style={styles.registerContainer}>
            <Text
              style={[
                styles.registerText,
                { color: colors.mutedForeground },
              ]}
            >
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text
                style={[
                  styles.registerLink,
                  { color: colors.primary },
                ]}
              >
                Register
              </Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: Spacing.xl,
  },
  pinLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  pinInput: {
    marginBottom: Spacing.sm,
  },
  forgotPin: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotPinText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  button: {
    marginBottom: Spacing.lg,
  },
  slowHint: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: FontSize.sm,
  },
  registerLink: {
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
});