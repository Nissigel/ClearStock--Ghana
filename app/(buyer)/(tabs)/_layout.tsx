import { Tabs } from 'expo-router';
import { View, StyleSheet, Keyboard, type ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontSize } from '@/constants/theme';
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

export default function BuyerLayout() {
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
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="search-outline" color={color} size={size} />
          ),
        }}
        listeners={{
          tabPress: () => {
            Keyboard.dismiss();
          },
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt-outline" color={color} size={size} />
          ),
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

      {/* Hidden routes — part of the tab group but not shown as tabs. The
          shared detail screens now live in (buyer)/(screens), a sibling of
          this tab group in the parent Stack, so they present above the tab
          bar and pop cleanly. */}
      <Tabs.Screen name="saved" options={{ href: null }} />
      <Tabs.Screen name="listing/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: FontSize.xs,
    fontFamily: 'Inter_500Medium',
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
});
