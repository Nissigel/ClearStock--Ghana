import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing, Radius } from '@/constants/theme';

interface SaleEndsCountdownProps {
  /** When the clearance sale closes (listing clearanceEndDate). */
  endsAt: string;
  /** Small chip form (icon + time only) for listing cards. */
  compact?: boolean;
  style?: ViewStyle;
}

/** Only worth showing once the sale is genuinely close to ending. */
const SHOW_WITHIN_MS = 3 * 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');

const formatRemaining = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return days > 0
    ? `${days}d ${pad(h)}:${pad(m)}:${pad(s)}`
    : `${pad(h)}:${pad(m)}:${pad(s)}`;
};

/**
 * Counts down to the end of the sale. Deliberately shows only the closing
 * time — never the next automatic price drop — so buyers aren't encouraged to
 * hold out for a lower price instead of buying.
 */
export function SaleEndsCountdown({
  endsAt,
  compact,
  style,
}: SaleEndsCountdownProps) {
  const { colors } = useTheme();

  const endsAtMs = useMemo(() => {
    const t = new Date(endsAt).getTime();
    return Number.isNaN(t) ? null : t;
  }, [endsAt]);

  const [remaining, setRemaining] = useState(() =>
    endsAtMs ? endsAtMs - Date.now() : 0
  );

  useEffect(() => {
    if (endsAtMs == null) return;
    setRemaining(endsAtMs - Date.now());
    const timer = setInterval(() => {
      setRemaining(endsAtMs - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [endsAtMs]);

  // Show nothing until the last few days: a countdown running for weeks is just
  // noise, and it only creates urgency when the end is actually near. Also hide
  // it once the sale is over, or if the date is unusable.
  if (endsAtMs == null || remaining <= 0 || remaining > SHOW_WITHIN_MS) {
    return null;
  }

  if (compact) {
    return (
      <View style={[styles.compact, style]}>
        <Ionicons name="time-outline" size={12} color={colors.flame} />
        <Text
          size="xs"
          weight="semiBold"
          color={colors.flame}
          style={styles.compactValue}
        >
          {formatRemaining(remaining)}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.flame,
          borderRadius: Radius.md,
        },
        style,
      ]}
    >
      <Ionicons name="time-outline" size={16} color={colors.flame} />
      <Text size="sm" color={colors.mutedForeground} style={styles.label}>
        Sale ends in
      </Text>
      <Text size="sm" weight="bold" color={colors.flame} style={styles.value}>
        {formatRemaining(remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
  },
  label: {
    fontSize: FontSize.sm,
  },
  value: {
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactValue: {
    fontVariant: ['tabular-nums'],
  },
});
