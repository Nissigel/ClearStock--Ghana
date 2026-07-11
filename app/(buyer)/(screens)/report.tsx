import { View, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spacing } from '@/constants/theme';

export default function ReportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { targetId, reportType } = useLocalSearchParams<{
    targetId: string;
    reportType: string;
  }>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for your report');
      return;
    }
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. We will review it shortly.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch {
      setError('Failed to submit report. Please try again.');
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
        title={`Report ${reportType === 'LISTING' ? 'Listing' : 'User'}`}
        onBackPress={() => router.replace('/(buyer)/profile')}
      />
      <View style={styles.content}>
        <Input
          label="Reason for Report"
          placeholder="Describe why you are reporting this..."
          value={reason}
          onChangeText={(v) => {
            setReason(v);
            if (error) setError('');
          }}
          multiline
          numberOfLines={6}
          error={error}
        />
        <Button
          label="Submit Report"
          onPress={handleSubmit}
          loading={loading}
          disabled={!reason.trim()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.base },
});