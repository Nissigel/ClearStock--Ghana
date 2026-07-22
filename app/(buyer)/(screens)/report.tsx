import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
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

const LISTING_CATEGORIES = [
  'Misleading Information',
  'Wrong Price',
  'Prohibited Product',
  'Fake Product',
  'Duplicate Listing',
];

const USER_CATEGORIES = [
  'No-show',
  'Fraud',
  'Harassment',
  'Time-wasting',
  'Abusive language',
];

export default function ReportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { targetId, reportType, targetName } = useLocalSearchParams<{
    targetId: string;
    reportType: string;
    targetName?: string;
  }>();
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
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
        category: category || undefined,
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
        {/* A short category alongside the free text: moderators triage a
            queue, and "Fraud" tells them more at a glance than the first
            line of a paragraph. */}
        <Text style={[styles.label, { color: colors.foreground }]}>
          What kind of problem is it?
        </Text>
        <View style={styles.categoryRow}>
          {(type === 'LISTING' ? LISTING_CATEGORIES : USER_CATEGORIES).map(
            (option) => {
              const selected = category === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setCategory(option)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: selected ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>

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
  label: { fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.xs },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryText: { fontSize: FontSize.sm, fontWeight: '500' },
  intro: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
});