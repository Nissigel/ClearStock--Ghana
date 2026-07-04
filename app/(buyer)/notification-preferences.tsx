import { View, Text, Switch, StyleSheet } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FontSize, Spacing, Radius } from '@/constants/theme';

export default function NotificationPreferencesScreen() {
  const { colors } = useTheme();
  const [prefs, setPrefs] = useState({
    messages: true,
    purchaseRequests: true,
    listings: true,
    transactions: true,
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const items = [
    { key: 'messages', label: 'Messages', desc: 'New messages from buyers or sellers' },
    { key: 'purchaseRequests', label: 'Purchase Requests', desc: 'Request accepted, declined or expired' },
    { key: 'listings', label: 'Listings', desc: 'Price changes and listing updates' },
    { key: 'transactions', label: 'Transactions', desc: 'Transaction status updates' },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader showBack title="Notification Preferences" />
      <View style={styles.content}>
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
          {items.map((item, index) => (
            <View
              key={item.key}
              style={[
                styles.row,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: index < items.length - 1 ? 0.5 : 0,
                },
              ]}
            >
              <View style={styles.rowText}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                <Text style={[styles.desc, { color: colors.mutedForeground }]}>
                  {item.desc}
                </Text>
              </View>
              <Switch
                value={prefs[item.key as keyof typeof prefs]}
                onValueChange={() => togglePref(item.key as keyof typeof prefs)}
                trackColor={{
                  false: colors.muted,
                  true: colors.primary,
                }}
                thumbColor={colors.card}
              />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.base },
  card: { borderWidth: 0.5, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  rowText: { flex: 1 },
  label: { fontSize: FontSize.base, fontWeight: '500', marginBottom: 2 },
  desc: { fontSize: FontSize.xs },
});