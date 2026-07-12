import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing, Radius } from '@/constants/theme';

interface PriceDropCountdownProps {
  /** Anchor the drop schedule off this timestamp (listing createdAt). */
  createdAt: string;
  /** Days between automatic price drops. */
  intervalDays: number;
  /** Small chip form (icon + time only) for listing cards. */
  compact?: boolean;
  style?: ViewStyle;
}

const DAY_MS = 24 * 60 * 60 * 1000;

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

// The next drop is the first interval boundary (measured from createdAt)
// that lies in the future.
const nextDropFrom = (createdAt: string, intervalDays: number): number | null => {
  const intervalMs = intervalDays * DAY_MS;
  if (!(intervalMs > 0)) return null;
  const anchor = new Date(createdAt).getTime();
  if (Number.isNaN(anchor)) return null;
  const periods = Math.floor((Date.now() - anchor) / intervalMs) + 1;
  return anchor + periods * intervalMs;
};

export function PriceDropCountdown({
  createdAt,
  intervalDays,
  compact,
  style,
}: PriceDropCountdownProps) {
  const { colors } = useTheme();
  const nextDrop = useMemo(
    () => nextDropFrom(createdAt, intervalDays),
    [createdAt, intervalDays]
  );

  const [remaining, setRemaining] = useState(() =>
    nextDrop ? nextDrop - Date.now() : 0
  );

  useEffect(() => {
    if (nextDrop == null) return;
    setRemaining(nextDrop - Date.now());
    const timer = setInterval(() => {
      setRemaining(nextDrop - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [nextDrop]);

  if (nextDrop == null) return null;

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
        Price drops again in
      </Text>
      <Text
        size="sm"
        weight="bold"
        color={colors.flame}
        style={styles.value}
      >
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
