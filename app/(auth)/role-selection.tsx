import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FontSize, Spacing, Radius } from '@/constants/theme';

type Role = 'BUYER' | 'SELLER' | 'BOTH';

interface RoleOption {
  key: Role;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const ROLES: RoleOption[] = [
  {
    key: 'BUYER',
    title: 'Buyer',
    description: 'Find discounted surplus stock near you',
    icon: 'bag-handle-outline',
  },
  {
    key: 'SELLER',
    title: 'Seller',
    description: 'List surplus inventory and recover value',
    icon: 'storefront-outline',
  },
  {
    key: 'BOTH',
    title: 'Both',
    description: 'Buy great deals and sell your surplus',
    icon: 'swap-horizontal-outline',
  },
];

export default function RoleSelectionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);

  const handleContinue = () => {
    if (!role) return;
    if (role === 'BUYER') {
      router.replace('/(buyer)/(tabs)/home');
    } else {
      // Seller / Both need business details before selling — send them
      // through the become-seller form, which lands on the seller dashboard.
      router.replace('/(buyer)/(screens)/become-seller');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader transparent containerStyle={styles.header} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          How will you use ClearStock?
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          You can change this anytime in settings.
        </Text>

        <View style={styles.options}>
          {ROLES.map((option) => {
            const selected = role === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => setRole(option.key)}
                activeOpacity={0.85}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                    borderRadius: Radius.lg,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: colors.secondary },
                  ]}
                >
                  <Ionicons name={option.icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {option.title}
                  </Text>
                  <Text
                    style={[styles.cardDesc, { color: colors.mutedForeground }]}
                  >
                    {option.description}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={selected ? colors.primary : colors.border}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!role}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { borderBottomWidth: 0 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xl,
  },
  options: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: FontSize.xs,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: Spacing.xl,
  },
});
