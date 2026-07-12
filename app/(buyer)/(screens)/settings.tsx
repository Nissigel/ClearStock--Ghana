import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/store/themeStore';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { logout } from '@/api/auth.api';
import { setEmailNotifications } from '@/api/user.api';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { APP_VERSION } from '@/constants/app';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const isDark = useThemeStore((state) => state.isDark);
  const setColorScheme = useThemeStore((state) => state.setColorScheme);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const reset = useModeStore((state) => state.reset);

  // Single email-notifications flag (the only one the backend supports).
  const emailNotifications = user?.emailNotifications ?? true;

  const toggleNotifications = (value: boolean) => {
    if (!user) return;
    const previous = user;
    setUser({ ...user, emailNotifications: value });
    setEmailNotifications(value)
      .then(setUser)
      .catch(() => setUser(previous));
  };

  const handleLogout = async () => {
    await logout();
    clearAuth();
    reset();
    router.replace('/splash');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader showBack title="Settings" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          PREFERENCES
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.lg,
            },
          ]}
        >
          <ToggleRow
            label="Dark Mode"
            description="Use the dark appearance"
            value={isDark}
            onValueChange={(v) => setColorScheme(v ? 'dark' : 'light')}
            colors={colors}
          />
          <ToggleRow
            label="Email Notifications"
            description="Get order and message updates by email"
            value={emailNotifications}
            onValueChange={toggleNotifications}
            disabled={!user}
            colors={colors}
            isLast
          />
        </View>

        {/* Discovery */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          DISCOVERY
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.lg,
            },
          ]}
        >
          <LinkRow
            label="Deal Alerts"
            description="Notify me when prices drop"
            onPress={() => router.push('/(buyer)/(screens)/deal-alerts')}
            colors={colors}
            isLast
          />
        </View>

        {/* Account */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          ACCOUNT
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.lg,
            },
          ]}
        >
          <LinkRow
            label="Change PIN"
            onPress={() => router.push('/(buyer)/(screens)/change-pin')}
            colors={colors}
          />
          <LinkRow
            label="Update Email"
            onPress={() => router.push('/(buyer)/(screens)/edit-profile')}
            colors={colors}
            isLast
          />
        </View>

        <View style={styles.logout}>
          <Button
            label="Log Out"
            onPress={handleLogout}
            variant="destructive"
          />
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          ClearStock Ghana · v{APP_VERSION}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface RowColors {
  foreground: string;
  mutedForeground: string;
  border: string;
  muted: string;
  primary: string;
}

function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
  colors,
  isLast,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  colors: RowColors;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : 0.5,
        },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor="#ffffff"
      />
    </View>
  );
}

function LinkRow({
  label,
  description,
  onPress,
  colors,
  isLast,
}: {
  label: string;
  description?: string;
  onPress: () => void;
  colors: RowColors;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.row,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: isLast ? 0 : 0.5,
        },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: Spacing.xs,
  },
  card: {
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: FontSize.base, fontWeight: '500', marginBottom: 2 },
  rowDesc: { fontSize: FontSize.xs },
  logout: {
    marginTop: Spacing.xl,
  },
  version: {
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
