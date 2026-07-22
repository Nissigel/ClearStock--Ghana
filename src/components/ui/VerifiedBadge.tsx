import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing, Radius } from '@/constants/theme';

interface VerifiedBadgeProps {
  /** Nothing renders when the shop is not verified. */
  verified?: boolean | null;
  /** Just the tick, for tight spaces like a listing card. */
  compact?: boolean;
  size?: number;
}

/**
 * Marks a shop whose Ghana Card was checked by ClearStock.
 *
 * Buyers are handing money to strangers, so this is the main signal that
 * somebody real stands behind a listing — it appears next to the seller's
 * name wherever a buyer sees one.
 */
export function VerifiedBadge({
  verified,
  compact = false,
  size = 14,
}: VerifiedBadgeProps) {
  const { colors } = useTheme();

  if (!verified) return null;

  if (compact) {
    return (
      <Ionicons name="checkmark-circle" size={size} color={colors.primary} />
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
      <Ionicons name="checkmark-circle" size={size} color={colors.primary} />
      <Text style={[styles.text, { color: colors.primary }]}>Verified</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: FontSize.xs, fontWeight: '700' },
});
