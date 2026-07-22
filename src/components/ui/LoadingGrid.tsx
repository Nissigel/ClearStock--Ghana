import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Radius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 2 - Spacing.sm) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 0.85;

function SkeletonBox({
  width: w,
  height: h,
  borderRadius = 8,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          width: w as number,
          height: h,
          borderRadius,
          backgroundColor: colors.muted,
        },
        style,
      ]}
    />
  );
}

function ListingCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: Radius.lg,
          borderColor: colors.border,
        },
      ]}
    >
      <SkeletonBox
        width={CARD_WIDTH}
        height={IMAGE_HEIGHT}
        borderRadius={0}
      />
      <View style={styles.details}>
        <SkeletonBox width="90%" height={14} style={styles.mb} />
        <SkeletonBox width="60%" height={14} style={styles.mb} />
        <SkeletonBox width="75%" height={12} />
      </View>
    </View>
  );
}

export function LoadingGrid() {
  return (
    <View style={styles.container}>
      {Array.from({ length: 6 }).map((_, index) => (
        <ListingCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
    borderWidth: 0.5,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  details: {
    padding: Spacing.sm,
  },
  mb: {
    marginBottom: Spacing.xs,
  },
});