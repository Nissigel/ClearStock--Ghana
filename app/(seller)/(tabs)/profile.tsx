import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { logout } from '@/api/auth.api';
import { getMyTransactions } from '@/api/transaction.api';
import { getSellerRatingSummary } from '@/api/review.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';

function StatColumn({
  label,
  value,
  colors,
  star,
}: {
  label: string;
  value: string | number;
  colors: any;
  star?: boolean;
}) {
  return (
    <View style={styles.statColumn}>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, { color: colors.foreground }]}>
          {value}
        </Text>
        {star && value !== '—' && (
          <Ionicons name="star" size={13} color={colors.gold} />
        )}
      </View>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

export default function SellerProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const switchToBuyer = useModeStore((state) => state.switchToBuyer);
  const reset = useModeStore((state) => state.reset);

  const { data: transactions } = useQuery({
    queryKey: ['buyer-transactions'],
    queryFn: getMyTransactions,
  });

  const { data: rating } = useQuery({
    queryKey: ['seller-rating', user?.id],
    queryFn: () => getSellerRatingSummary(String(user?.id)),
    enabled: !!user?.id,
  });

  const completed = (transactions ?? []).filter(
    (t) => t.transactionStatus === 'COMPLETED'
  );
  const boughtCount = completed.filter(
    (t) => String(t.buyerUserId) === user?.id
  ).length;
  const soldCount = completed.filter(
    (t) => String(t.sellerUserId) === user?.id
  ).length;
  const ratingLabel =
    rating && rating.totalReviews > 0 ? rating.averageRating.toFixed(1) : '—';

  const handleLogout = async () => {
    await logout();
    clearAuth();
    reset();
    router.replace('/splash');
  };

  const handleSwitchToBuyer = () => {
    switchToBuyer();
    router.replace('/(buyer)/(tabs)/home');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.profileHeader,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Avatar uri={user?.profilePhotoUrl} name={user?.fullName} size="xl" />
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.fullName}
          </Text>
          <Text style={[styles.userPhone, { color: colors.mutedForeground }]}>
            {user?.phoneNumber}
          </Text>

          {/* Stat row */}
          <View style={[styles.statRow, { borderTopColor: colors.border }]}>
            <StatColumn label="Sold" value={soldCount} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatColumn label="Bought" value={boughtCount} colors={colors} />
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <StatColumn
              label="Rating"
              value={ratingLabel}
              colors={colors}
              star
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSwitchToBuyer}
          style={[
            styles.switchCard,
            {
              backgroundColor: colors.secondary,
              borderRadius: Radius.lg,
              ...Shadow.sm,
            },
          ]}
        >
          <Ionicons name="swap-horizontal-outline" size={22} color={colors.primary} />
          <Text style={[styles.switchText, { color: colors.primary }]}>
            Switch to Buyer Mode
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.section}>
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: Radius.lg,
              },
            ]}
          >
            {[
              { icon: 'storefront-outline', label: 'Seller Profile', route: '/(seller)/(screens)/seller-profile' },
              { icon: 'leaf-outline', label: 'Recovery Impact', route: '/(seller)/(screens)/recovery-impact' },
              { icon: 'swap-horizontal-outline', label: 'Transaction History', route: '/(seller)/(screens)/transactions' },
              { icon: 'person-outline', label: 'Edit Profile', route: '/(buyer)/(screens)/edit-profile' },
              { icon: 'settings-outline', label: 'Settings', route: '/(buyer)/(screens)/settings' },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => router.push(item.route as any)}
                style={[
                  styles.settingsRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.settingsIcon, { backgroundColor: colors.secondary }]}>
                  <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.settingsLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={handleLogout}
              style={styles.settingsRow}
            >
              <View style={[styles.settingsIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
              </View>
              <Text style={[styles.settingsLabel, { color: colors.destructive }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  profileHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 0.5,
    marginBottom: Spacing.base,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  userPhone: { fontSize: FontSize.sm },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 0.5,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 0.5,
    height: 28,
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  switchText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    flex: 1,
  },
  section: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  sectionCard: {
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 0.5,
    gap: Spacing.md,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontSize: FontSize.base,
    flex: 1,
  },
});