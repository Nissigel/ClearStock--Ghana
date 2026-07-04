import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { useQuery } from '@tanstack/react-query';
import { getMyListings } from '@/api/listing.api';
import { getSellerPurchaseRequests } from '@/api/transaction.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  colors: any;
  onPress?: () => void;
}

function StatCard({ label, value, icon, colors, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
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
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SellerDashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const switchToBuyer = useModeStore((state) => state.switchToBuyer);

  const { data: listings } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: getMyListings,
  });

  const { data: requests } = useQuery({
    queryKey: ['seller-requests'],
    queryFn: getSellerPurchaseRequests,
  });

  const activeListings = listings?.filter((l) => l.status === 'ACTIVE').length ?? 0;
  const totalListings = listings?.length ?? 0;
  const pendingRequests = requests?.filter((r) => r.status === 'PENDING').length ?? 0;
  const totalRequests = requests?.length ?? 0;
  const recoveredValue = listings
    ?.filter((l) => l.status === 'ACTIVE')
    .reduce((sum, l) => sum + l.currentPrice, 0) ?? 0;

  const handleSwitchToBuyer = () => {
    switchToBuyer();
    router.replace('/(buyer)/home');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.fullName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSwitchToBuyer}
          style={[
            styles.switchButton,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={16}
            color={colors.primary}
          />
          <Text style={[styles.switchText, { color: colors.primary }]}>
            Buyer Mode
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Overview
        </Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Listings"
            value={totalListings}
            icon="cube-outline"
            colors={colors}
            onPress={() => router.push('/(seller)/listings')}
          />
          <StatCard
            label="Active Listings"
            value={activeListings}
            icon="checkmark-circle-outline"
            colors={colors}
          />
          <StatCard
            label="Pending Requests"
            value={pendingRequests}
            icon="time-outline"
            colors={colors}
            onPress={() => router.push('/(seller)/requests')}
          />
          <StatCard
            label="Total Requests"
            value={totalRequests}
            icon="document-text-outline"
            colors={colors}
          />
          <StatCard
            label="Recovered Value"
            value={`${CURRENCY_SYMBOL}${recoveredValue.toFixed(0)}`}
            icon="trending-up-outline"
            colors={colors}
          />
          <StatCard
            label="Completed Sales"
            value={requests?.filter((r) => r.status === 'COMPLETED').length ?? 0}
            icon="checkmark-circle-outline"
            colors={colors}
          />
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Quick Actions
        </Text>
        <View
          style={[
            styles.quickActions,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.lg,
              ...Shadow.sm,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.quickAction,
              { borderBottomColor: colors.border },
            ]}
            onPress={() => router.push({ pathname: '/(seller)/create-listing' })}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={colors.primary}
            />
            <Text
              style={[styles.quickActionText, { color: colors.foreground }]}
            >
              Create New Listing
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.quickAction,
              { borderBottomColor: colors.border },
            ]}
            onPress={() => router.push('/(seller)/requests')}
          >
            <Ionicons
              name="document-text-outline"
              size={22}
              color={colors.primary}
            />
            <Text
              style={[styles.quickActionText, { color: colors.foreground }]}
            >
              View Purchase Requests
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(seller)/messages')}
          >
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={colors.primary}
            />
            <Text
              style={[styles.quickActionText, { color: colors.foreground }]}
            >
              Check Messages
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  greeting: {
    fontSize: FontSize.sm,
  },
  userName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  switchText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '47%',
    padding: Spacing.base,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  quickActions: {
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 0.5,
    gap: Spacing.md,
  },
  quickActionText: {
    fontSize: FontSize.base,
    flex: 1,
  },
});