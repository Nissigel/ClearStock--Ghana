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
import { Spacing, FontSize } from '@/constants/theme';
import { PIN_LENGTH } from '@/constants/app';

export default function CreatePinScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { tempToken, phoneNumber, email } = useLocalSearchParams<{
    tempToken: string;
    phoneNumber: string;
    email?: string;
  }>();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const validate = (): boolean => {
    if (pin.length < PIN_LENGTH) {
      setError(`PIN must be ${PIN_LENGTH} digits`);
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    router.push({
      pathname: '/(auth)/confirm-pin',
      params: { tempToken, phoneNumber, pin, email: email ?? '' },
    });
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
            Create your PIN
          </Text>
          <Text
            style={[
              styles.topSubtitle,
              { color: colors.mutedForeground },
            ]}
          >
            This PIN keeps your account secure
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
            Choose a 4-digit PIN
          </Text>
          <Text
            style={[styles.subheading, { color: colors.mutedForeground }]}
          >
            You will use this PIN every time you log in
          </Text>

          <PinInput
            value={pin}
            onChange={(value) => {
              setPin(value);
              if (error) setError('');
            }}
            error={error}
            containerStyle={styles.pinInput}
          />

          <Button
            label="Next"
            onPress={handleNext}
            disabled={pin.length < PIN_LENGTH}
            style={styles.button}
          />

          <Text
            style={[styles.warning, { color: colors.mutedForeground }]}
          >
            Do not share your PIN with anyone. ClearStock Ghana
            will never ask for your PIN.
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
  warning: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});