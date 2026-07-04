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
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { logout } from '@/api/auth.api';
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
              ? '#fee2e2'
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

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const hasSellerProfile = useModeStore((state) => state.hasSellerProfile);
  const switchToSeller = useModeStore((state) => state.switchToSeller);
  const reset = useModeStore((state) => state.reset);

  const handleLogout = async () => {
    await logout();
    clearAuth();
    reset();
    router.replace('/splash');
  };

  const handleSwitchToSeller = () => {
    if (hasSellerProfile) {
      switchToSeller();
      router.replace('/(seller)/dashboard');
    } else {
      router.push('/(buyer)/become-seller');
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
          <Text
            style={[styles.userLocation, { color: colors.mutedForeground }]}
          >
            {user?.cityTown}, {user?.region}
          </Text>
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
              onPress={() => router.push('/(buyer)/edit-profile')}
              colors={colors}
            />
            <SettingsRow
              icon="call-outline"
              label="Change Phone Number"
              onPress={() => router.push('/(buyer)/change-phone')}
              colors={colors}
            />
            <SettingsRow
              icon="lock-closed-outline"
              label="Change PIN"
              onPress={() => router.push('/(buyer)/change-pin')}
              colors={colors}
            />
            <SettingsRow
              icon="notifications-outline"
              label="Notification Preferences"
              onPress={() => router.push('/(buyer)/notification-preferences')}
              colors={colors}
              showArrow
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
              icon="document-text-outline"
              label="Purchase Requests"
              onPress={() => router.push('/(buyer)/purchase-requests/index')}
              colors={colors}
            />
            <SettingsRow
              icon="swap-horizontal-outline"
              label="Transaction History"
              onPress={() => router.push('/(buyer)/transactions')}
              colors={colors}
            />
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() => router.push('/(buyer)/notifications')}
              colors={colors}
            />
            <SettingsRow
              icon="notifications-outline"
              label="Deal Alerts"
              onPress={() => router.push('/(buyer)/deal-alerts')}
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