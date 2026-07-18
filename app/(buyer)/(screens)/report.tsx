import { View, Text, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { AxiosError } from 'axios';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { KeyboardAvoidingWrapper } from '@/components/ui/KeyboardAvoidingWrapper';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createReport } from '@/api/report.api';
import { FontSize, Spacing } from '@/constants/theme';
import type { ReportType } from '@/types/report.types';

export default function ReportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { targetId, reportType, targetName } = useLocalSearchParams<{
    targetId: string;
    reportType: string;
    targetName?: string;
  }>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const type: ReportType = reportType === 'LISTING' ? 'LISTING' : 'USER';

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for your report');
      return;
    }
    if (!targetId) {
      setError('Nothing to report — please go back and try again.');
      return;
    }
    try {
      setLoading(true);
      await createReport({
        reportType: type,
        targetId,
        reason: reason.trim(),
      });
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our team will review it shortly.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      const message =
        (err as AxiosError<{ message?: string }>).response?.data?.message ??
        'Failed to submit report. Please try again.';
      setError(message);
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
        title={type === 'LISTING' ? 'Report Listing' : 'Report User'}
        onBackPress={() => router.back()}
      />
      <KeyboardAvoidingWrapper containerStyle={styles.content}>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          {type === 'LISTING'
            ? 'Tell us what’s wrong with this listing — misleading details, wrong price, or anything that shouldn’t be on ClearStock.'
            : `Tell us what went wrong${
                targetName ? ` with ${targetName}` : ''
              } — poor conduct, no-shows, or anything that made this a bad experience.`}
        </Text>
        <Input
          label="Reason for Report"
          placeholder="Describe what happened..."
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
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.base },
  intro: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
});