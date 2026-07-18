import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { Text } from '@/components/ui/Typography';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { getSellerEarnings } from '@/api/seller.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';

const money = (n: number) =>
  `${CURRENCY_SYMBOL} ${Number(n ?? 0).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function SellerEarningsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-earnings'],
    queryFn: getSellerEarnings,
    refetchOnMount: 'always',
  });

  if (isLoading || !data) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScreenHeader showBack title="Earnings" onBackPress={() => router.back()} />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader showBack title="Earnings" onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Headline: what the seller actually takes home. */}
        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.primary, borderRadius: Radius.lg, ...Shadow.sm },
          ]}
        >
          <Text style={[styles.heroLabel, { color: colors.primaryForeground }]}>
            Your earnings after commission
          </Text>
          <Text style={[styles.heroValue, { color: colors.gold }]}>
            {money(data.totalNet)}
          </Text>
          <Text style={[styles.heroSub, { color: colors.primaryForeground }]}>
            From {money(data.totalGross)} in sales
          </Text>
        </View>

        {/* The two stages money passes through. */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: Radius.lg },
          ]}
        >
          <View style={styles.rowTop}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>
              Held until collection
            </Text>
          </View>
          <Text style={[styles.rowValue, { color: colors.foreground }]}>
            {money(data.heldNet)}
          </Text>
          <Text style={[styles.rowNote, { color: colors.mutedForeground }]}>
            {data.heldCount} {data.heldCount === 1 ? 'order' : 'orders'} paid for but not yet
            confirmed. Released once the buyer confirms collection with their code.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: Radius.lg },
          ]}
        >
          <View style={styles.rowTop}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>
              Cleared for payout
            </Text>
          </View>
          <Text style={[styles.rowValue, { color: colors.primary }]}>
            {money(data.clearedNet)}
          </Text>
          <Text style={[styles.rowNote, { color: colors.mutedForeground }]}>
            {data.clearedCount} completed {data.clearedCount === 1 ? 'order' : 'orders'}. This is
            yours — {money(data.paidOut)} has been paid out so far.
          </Text>
        </View>

        {/* Commission, shown plainly rather than buried. */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, borderRadius: Radius.lg },
          ]}
        >
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>
              Total sales
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.foreground }]}>
              {money(data.totalGross)}
            </Text>
          </View>
          <View style={[styles.breakdownRow, { borderTopColor: colors.border, borderTopWidth: 0.5 }]}>
            <Text style={[styles.breakdownLabel, { color: colors.mutedForeground }]}>
              ClearStock commission ({data.commissionRate}%)
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.destructive }]}>
              −{money(data.totalCommission)}
            </Text>
          </View>
          <View style={[styles.breakdownRow, { borderTopColor: colors.border, borderTopWidth: 0.5 }]}>
            <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>You receive</Text>
            <Text style={[styles.breakdownTotal, { color: colors.primary }]}>
              {money(data.totalNet)}
            </Text>
          </View>
        </View>

        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
          ClearStock holds each payment until the buyer confirms collection, which protects both
          sides. Payouts are arranged with you directly.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, gap: Spacing.md },
  heroCard: { padding: Spacing.xl, alignItems: 'center' },
  heroLabel: { fontSize: FontSize.sm, opacity: 0.9 },
  heroValue: { fontSize: FontSize['2xl'], fontWeight: 'bold', marginVertical: Spacing.xs },
  heroSub: { fontSize: FontSize.xs, opacity: 0.85 },
  card: { padding: Spacing.base, borderWidth: 0.5 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  rowTitle: { fontSize: FontSize.sm, fontWeight: '600' },
  rowValue: { fontSize: FontSize.xl, fontWeight: 'bold', marginTop: Spacing.xs },
  rowNote: { fontSize: FontSize.xs, lineHeight: 18, marginTop: Spacing.xs },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  breakdownLabel: { fontSize: FontSize.sm, flex: 1 },
  breakdownValue: { fontSize: FontSize.sm, fontWeight: '600' },
  breakdownTotal: { fontSize: FontSize.md, fontWeight: 'bold' },
  footnote: { fontSize: FontSize.xs, lineHeight: 18, textAlign: 'center' },
});
