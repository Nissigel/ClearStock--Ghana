import { View, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { Spacing } from '@/constants/theme';

export default function ChangePhoneScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!phoneNumber.trim() || phoneNumber.length < 9) {
      setError('Enter a valid Ghana phone number');
      return;
    }
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.back();
    } catch {
      setError('Failed to send OTP. Please try again.');
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
        onBackPress={() => router.replace('/(buyer)/profile')}
      />
      <KeyboardAvoidingWrapper>
        <View style={styles.content}>
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
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.base },
});