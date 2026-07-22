import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing, Radius } from '@/constants/theme';

type BadgeVariant =
  | 'verified'
  | 'unverified'
  | 'pending'
  | 'rejected'
  | 'active'
  | 'outOfStock'
  | 'expired'
  | 'archived'
  | 'discount'
  | 'expirySoon';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  style?: ViewStyle;
}

export function Badge({ variant, label, style }: BadgeProps) {
  const { colors } = useTheme();

  const getConfig = (): { bg: string; text: string; defaultLabel: string } => {
    switch (variant) {
      case 'verified':
        return {
          bg: colors.gold,
          text: colors.goldForeground,
          defaultLabel: '✓ Verified',
        };
      case 'unverified':
        return {
          bg: colors.muted,
          text: colors.mutedForeground,
          defaultLabel: 'Unverified',
        };
      case 'pending':
        return {
          bg: colors.warning,
          text: colors.warningForeground,
          defaultLabel: 'Pending',
        };
      case 'rejected':
        return {
          bg: colors.destructive,
          text: colors.destructiveForeground,
          defaultLabel: 'Rejected',
        };
      case 'active':
        return {
          bg: colors.success,
          text: colors.successForeground,
          defaultLabel: 'Active',
        };
      case 'outOfStock':
        return {
          bg: colors.warning,
          text: colors.warningForeground,
          defaultLabel: 'Out of Stock',
        };
      case 'expired':
        return {
          bg: colors.destructive,
          text: colors.destructiveForeground,
          defaultLabel: 'Expired',
        };
      case 'archived':
        return {
          bg: colors.muted,
          text: colors.mutedForeground,
          defaultLabel: 'Archived',
        };
      case 'discount':
        return {
          bg: colors.flame,
          text: colors.destructiveForeground,
          defaultLabel: 'Sale',
        };
      case 'expirySoon':
        return {
          bg: colors.warning,
          text: colors.warningForeground,
          defaultLabel: 'Expiring Soon',
        };
    }
  };

  const config = getConfig();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg, borderRadius: Radius.full },
        style,
      ]}
    >
      <Text style={[styles.text, { color: config.text }]}>
        {label ?? config.defaultLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});