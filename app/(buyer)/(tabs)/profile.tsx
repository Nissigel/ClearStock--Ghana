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
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { logout } from '@/api/auth.api';
import { getMyTransactions } from '@/api/transaction.api';
import { getSellerRatingSummary } from '@/api/review.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';

interface SettingsRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  value?: string;
  showArrow?: boolean;
  destructive?: boolean;
  colors: any;
}

function SettingsRow({
  icon,
  label,
  onPress,
  value,
  showArrow = true,
  destructive = false,
  colors,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.settingsRow,
        { borderBottomColor: colors.border },
      ]}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.settingsIcon,
          {
            backgroundColor: destructive
              ? colors.muted
              : colors.secondary,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={destructive ? colors.destructive : colors.primary}
        />
      </View>
      <Text
        style={[
          styles.settingsLabel,
          {
            color: destructive ? colors.destructive : colors.foreground,
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.settingsRight}>
        {value && (
          <Text
            style={[
              styles.settingsValue,
              { color: colors.mutedForeground },
            ]}
          >
            {value}
          </Text>
        )}
        {showArrow && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.mutedForeground}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

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

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const hasSellerProfile = useAuthStore((state) => state.hasSellerProfile);
  const switchToSeller = useModeStore((state) => state.switchToSeller);
  const reset = useModeStore((state) => state.reset);

  // The stat row is non-essential, so tolerate backend errors: a failed call
  // resolves to a safe default instead of rejecting (which would surface a
  // 500 and leave the row broken).
  const { data: transactions } = useQuery({
    queryKey: ['buyer-transactions'],
    queryFn: async () => {
      try {
        // Needs both roles — the sold/bought counters split this by user id.
        return await getMyTransactions();
      } catch {
        return [];
      }
    },
    retry: false,
  });

  const { data: rating } = useQuery({
    queryKey: ['seller-rating', user?.id],
    queryFn: async () => {
      try {
        return await getSellerRatingSummary(String(user?.id));
      } catch {
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  // GET /transactions is role-aware and returns every transaction the user is
  // party to, so split by role off the user id.
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

  const handleNavigate = (path: string) => {
    router.push(path as any);
  };

  const handleLogout = async () => {
    await logout();
    clearAuth();
    reset();
    router.replace('/splash');
  };

  const handleSwitchToSeller = () => {
    if (hasSellerProfile) {
      switchToSeller();
      router.replace('/(seller)/(tabs)/dashboard');
    } else {
      handleNavigate('/(buyer)/(screens)/become-seller');
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View
          style={[
            styles.profileHeader,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Avatar
            uri={user?.profilePhotoUrl}
            name={user?.fullName}
            size="xl"
          />
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {user?.fullName ?? 'User'}
          </Text>
          <Text
            style={[styles.userPhone, { color: colors.mutedForeground }]}
          >
            {user?.phoneNumber}
          </Text>
          {(user?.cityTown || user?.region) && (
            <Text
              style={[styles.userLocation, { color: colors.mutedForeground }]}
            >
              {[user?.cityTown, user?.region].filter(Boolean).join(', ')}
            </Text>
          )}

          {/* Role badges */}
          <View style={styles.roleBadges}>
            <View
              style={[styles.roleBadge, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                Buyer
              </Text>
            </View>
            {hasSellerProfile && (
              <View
                style={[styles.roleBadge, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                  Seller
                </Text>
              </View>
            )}
          </View>

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

        {/* Seller Mode Switch */}
        <TouchableOpacity
          onPress={handleSwitchToSeller}
          style={[
            styles.sellerModeCard,
            {
              backgroundColor: colors.primary,
              borderRadius: Radius.lg,
              ...Shadow.sm,
            },
          ]}
        >
          <View style={styles.sellerModeLeft}>
            <Ionicons
              name="storefront-outline"
              size={24}
              color={colors.gold}
            />
            <View style={styles.sellerModeText}>
              <Text
                style={[
                  styles.sellerModeTitle,
                  { color: colors.primaryForeground },
                ]}
              >
                {hasSellerProfile ? 'Switch to Seller Mode' : 'Become a Seller'}
              </Text>
              <Text
                style={[
                  styles.sellerModeSubtitle,
                  { color: colors.primaryForeground },
                ]}
              >
                {hasSellerProfile
                  ? 'Manage your listings and orders'
                  : 'Start selling your surplus stock'}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.primaryForeground}
          />
        </TouchableOpacity>

        {/* Account Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            ACCOUNT
          </Text>
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
            <SettingsRow
              icon="person-outline"
              label="Edit Profile"
              onPress={() => handleNavigate('/(buyer)/(screens)/edit-profile')}
              colors={colors}
            />
            <SettingsRow
              icon="call-outline"
              label="Change Phone Number"
              onPress={() => handleNavigate('/(buyer)/(screens)/change-phone')}
              colors={colors}
            />
            <SettingsRow
              icon="settings-outline"
              label="Settings"
              onPress={() => handleNavigate('/(buyer)/(screens)/settings')}
              colors={colors}
            />
          </View>
        </View>

        {/* Activity Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: colors.mutedForeground }]}
          >
            ACTIVITY
          </Text>
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
            <SettingsRow
              icon="heart-outline"
              label="Saved Items"
              onPress={() => handleNavigate('/(buyer)/(tabs)/saved')}
              colors={colors}
            />
            <SettingsRow
              icon="document-text-outline"
              label="Purchase Requests"
              onPress={() => handleNavigate('/(buyer)/(screens)/purchase-requests')}
              colors={colors}
            />
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() => handleNavigate('/(buyer)/(screens)/notifications')}
              colors={colors}
            />
            <SettingsRow
              icon="notifications-outline"
              label="Deal Alerts"
              onPress={() => handleNavigate('/(buyer)/(screens)/deal-alerts')}
              colors={colors}
            />
          </View>
        </View>

        {/* Logout */}
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
            <SettingsRow
              icon="log-out-outline"
              label="Logout"
              onPress={handleLogout}
              destructive
              showArrow={false}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
  userPhone: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  userLocation: {
    fontSize: FontSize.sm,
  },
  roleBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  roleBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
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
  sellerModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.base,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
  },
  sellerModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  sellerModeText: {
    flex: 1,
  },
  sellerModeTitle: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sellerModeSubtitle: {
    fontSize: FontSize.xs,
    opacity: 0.8,
  },
  section: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
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
  settingsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  settingsValue: {
    fontSize: FontSize.sm,
  },
  bottomPadding: {
    height: Spacing['4xl'],
  },
});