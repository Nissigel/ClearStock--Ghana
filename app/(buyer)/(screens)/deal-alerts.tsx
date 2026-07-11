import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { CATEGORIES } from '@/constants/categories';

export default function DealAlertsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [subscribedCategories, setSubscribedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const toggleCategory = (category: string) => {
    setSubscribedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
  };

  const subscribedCount = Object.values(subscribedCategories).filter(Boolean).length;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        title="Deal Alerts"
        onBackPress={() => router.replace('/(buyer)/profile')}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: colors.secondary,
              borderRadius: Radius.lg,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.infoTitle, { color: colors.primary }]}>
            Get notified about deals
          </Text>
          <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
            Choose the categories you want to receive deal alerts for. We will
            notify you when new discounted listings are posted.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Categories ({subscribedCount} selected)
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
          {CATEGORIES.map((category, index) => (
            <View
              key={category}
              style={[
                styles.row,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: index < CATEGORIES.length - 1 ? 0.5 : 0,
                },
              ]}
            >
              <Text style={[styles.categoryLabel, { color: colors.foreground }]}>
                {category}
              </Text>
              <Switch
                value={subscribedCategories[category] ?? false}
                onValueChange={() => toggleCategory(category)}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          ))}
        </View>

        <Button
          label="Save Preferences"
          onPress={handleSave}
          loading={loading}
          disabled={subscribedCount === 0}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  infoCard: {
    padding: Spacing.base,
    borderWidth: 0.5,
  },
  infoTitle: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  infoDesc: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  card: { borderWidth: 0.5, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
  },
  categoryLabel: { fontSize: FontSize.base },
});