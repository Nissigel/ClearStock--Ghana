import { View, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PinInput } from '@/components/ui/PinInput';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { FontSize, Spacing } from '@/constants/theme';
import { PIN_LENGTH } from '@/constants/app';
import { Text } from 'react-native';

export default function ChangePinScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');

  const handleNext = async () => {
    if (step === 'current') {
      if (currentPin.length < PIN_LENGTH) {
        setError('Enter your current PIN');
        return;
      }
      setError('');
      setStep('new');
    } else if (step === 'new') {
      if (newPin.length < PIN_LENGTH) {
        setError('PIN must be 4 digits');
        return;
      }
      setError('');
      setStep('confirm');
    } else {
      if (confirmPin !== newPin) {
        setError('PINs do not match');
        setConfirmPin('');
        return;
      }
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        router.back();
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const titles = {
    current: 'Enter Current PIN',
    new: 'Enter New PIN',
    confirm: 'Confirm New PIN',
  };

  const pins = {
    current: currentPin,
    new: newPin,
    confirm: confirmPin,
  };

  const setters = {
    current: setCurrentPin,
    new: setNewPin,
    confirm: setConfirmPin,
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        title="Change PIN"
        onBackPress={() => router.replace('/(buyer)/profile')}
      />
      <KeyboardAvoidingWrapper>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {titles[step]}
          </Text>
          <PinInput
            value={pins[step]}
            onChange={(val) => {
              setters[step](val);
              if (error) setError('');
            }}
            error={error}
            containerStyle={styles.pinInput}
          />
          <Button
            label={step === 'confirm' ? 'Change PIN' : 'Next'}
            onPress={handleNext}
            loading={loading}
            disabled={pins[step].length < PIN_LENGTH}
          />
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.base,
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xl,
  },
  pinInput: { marginBottom: Spacing.xl, width: '100%' },
});