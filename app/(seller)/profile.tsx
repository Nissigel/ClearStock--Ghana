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
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { logout } from '@/api/auth.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';

export default function SellerProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const switchToBuyer = useModeStore((state) => state.switchToBuyer);
  const reset = useModeStore((state) => state.reset);

  const handleLogout = async () => {
    await logout();
    clearAuth();
    reset();
    router.replace('/splash');
  };

  const handleSwitchToBuyer = () => {
    switchToBuyer();
    router.replace('/(buyer)/home');
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
              { icon: 'storefront-outline', label: 'Seller Profile', route: '/(seller)/seller-profile' },
              { icon: 'swap-horizontal-outline', label: 'Transaction History', route: '/(seller)/transactions' },
              { icon: 'person-outline', label: 'Edit Profile', route: '/(buyer)/edit-profile' },
              { icon: 'notifications-outline', label: 'Notifications', route: '/(buyer)/notifications' },
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
              <View style={[styles.settingsIcon, { backgroundColor: '#fee2e2' }]}>
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