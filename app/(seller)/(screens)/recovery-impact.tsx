import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useQuery } from '@tanstack/react-query';
import { getRecoveryDashboard } from '@/api/seller.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';

const formatGhs = (n: number) =>
  `${CURRENCY_SYMBOL}${Math.round(n).toLocaleString('en-GH')}`;

const formatCo2 = (kg: number) =>
  kg >= 1000 ? `${(kg / 1000).toFixed(1)} t` : `${Math.round(kg)} kg`;

export default function RecoveryImpactScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['recovery-dashboard'],
    queryFn: getRecoveryDashboard,
  });

  const stats = data
    ? [
        {
          label: 'Saved from waste',
          value: formatGhs(data.estimatedGhsSavedFromWaste),
          icon: 'leaf-outline' as const,
        },
        {
          label: 'Items rehomed',
          value: String(data.goodsRescued),
          icon: 'cube-outline' as const,
        },
        {
          label: 'Buyers reached',
          value: String(data.buyersReached ?? 0),
          icon: 'people-outline' as const,
        },
        {
          label: 'CO₂ avoided',
          value: formatCo2(data.co2AvoidedKg ?? 0),
          icon: 'cloud-outline' as const,
        },
      ]
    : [];

  const bullets = data
    ? [
        `Diverted ${data.goodsRescued} goods from landfill`,
        `Reached ${data.buyersReached ?? 0} buyers with affordable stock`,
        `Recovered ${formatGhs(
          data.totalGhsRecovered
        )} that would have been written off`,
      ]
    : [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader
        showBack
        title="Recovery Impact"
        onBackPress={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading || !data ? (
          <Text style={[styles.loading, { color: colors.mutedForeground }]}>
            Loading your impact…
          </Text>
        ) : (
          <>
            {/* Headline card */}
            <View
              style={[
                styles.headlineCard,
                {
                  backgroundColor: colors.primary,
                  borderRadius: Radius.xl,
                  ...Shadow.md,
                },
              ]}
            >
              <Text
                style={[styles.headlineLabel, { color: colors.primaryForeground }]}
              >
                Total value recovered
              </Text>
              <Text
                style={[styles.headlineValue, { color: colors.primaryForeground }]}
              >
                {formatGhs(data.totalGhsRecovered)}
              </Text>
              <Text
                style={[styles.headlineMeta, { color: colors.primaryForeground }]}
              >
                Across {data.totalTransactionsCompleted} completed sales
              </Text>
            </View>

            {/* Stat grid */}
            <View style={styles.grid}>
              {stats.map((stat) => (
                <View
                  key={stat.label}
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: Radius.lg,
                      ...Shadow.sm,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Ionicons name={stat.icon} size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.foreground }]}>
                    {stat.value}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: colors.mutedForeground }]}
                  >
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Impact bullets */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Your impact so far
            </Text>
            <View
              style={[
                styles.bulletCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: Radius.lg,
                },
              ]}
            >
              {bullets.map((bullet, index) => (
                <View
                  key={index}
                  style={[
                    styles.bulletRow,
                    {
                      borderBottomColor: colors.border,
                      borderBottomWidth: index < bullets.length - 1 ? 0.5 : 0,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.bulletText, { color: colors.foreground }]}>
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  loading: {
    fontSize: FontSize.base,
    textAlign: 'center',
    marginTop: Spacing['4xl'],
  },
  headlineCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.base,
  },
  headlineLabel: {
    fontSize: FontSize.sm,
    opacity: 0.9,
    marginBottom: Spacing.xs,
  },
  headlineValue: {
    fontSize: FontSize['4xl'],
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  headlineMeta: {
    fontSize: FontSize.xs,
    opacity: 0.85,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '47.5%',
    flexGrow: 1,
    padding: Spacing.base,
    borderWidth: 0.5,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.xs,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  bulletCard: {
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
  },
  bulletText: {
    fontSize: FontSize.sm,
    flex: 1,
  },
});
