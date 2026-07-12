import { Tabs, useRouter } from 'expo-router';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  type ColorValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, Shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useNotificationStore } from '@/store/notificationStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconsName;
  color: string | ColorValue;
  size: number;
  badge?: number;
}

function TabIcon({ name, color, size, badge }: TabIconProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={size} color={color as string} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <View
            style={[styles.badgeDot, { backgroundColor: colors.destructive }]}
          />
        </View>
      )}
    </View>
  );
}

// Raised center "+" button that launches the create-listing flow.
function CreateListingFab() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <View style={styles.fabWrapper} pointerEvents="box-none">
      <TouchableOpacity
        accessibilityLabel="Create a new listing"
        activeOpacity={0.85}
        onPress={() => router.push('/(seller)/(screens)/create-listing')}
        style={[
          styles.fab,
          { backgroundColor: colors.primary, ...Shadow.md },
        ]}
      >
        <Ionicons name="add" size={30} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

export default function SellerLayout() {
  const { colors } = useTheme();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="listings"
        options={{
          title: 'Listings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="cube-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-listing"
        options={{
          title: '',
          tabBarButton: () => <CreateListingFab />,
        }}
        listeners={{
          tabPress: (e) => {
            // Intercept — the FAB handles navigation itself.
            e.preventDefault();
          },
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name="chatbubble-outline"
              color={color}
              size={size}
              badge={unreadCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Hidden route — reachable via navigation, not shown as a tab. Shared
          detail screens live in (seller)/(screens), above this tab group. */}
      <Tabs.Screen name="requests" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: FontSize.xs,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
