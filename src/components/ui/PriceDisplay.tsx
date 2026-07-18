import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';

interface PriceDisplayProps {
  currentPrice: number;
  originalPrice: number;
  size?: 'sm' | 'md' | 'lg';
  /**
   * Turns the price red. Reserved for listings that are genuinely running out
   * — see isListingUrgent. Being discounted alone doesn't qualify.
   */
  urgent?: boolean;
  containerStyle?: ViewStyle;
}

export function PriceDisplay({
  currentPrice,
  originalPrice,
  size = 'md',
  urgent = false,
  containerStyle,
}: PriceDisplayProps) {
  const { colors } = useTheme();
  const isDiscounted = currentPrice < originalPrice;

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return { current: FontSize.sm, original: FontSize.xs };
      case 'md':
        return { current: FontSize.md, original: FontSize.sm };
      case 'lg':
        return { current: FontSize.xl, original: FontSize.base };
    }
  };

  const fontSize = getFontSize();

  // Prices read "GHS 250.00" rather than using the ₵ sign: Android served any
  // text run containing ₵ from a fallback font whose zero is slashed, so prices
  // came out as "₵25ө.өө". Plain ASCII can't be substituted.
  const formatPrice = (price: number): string =>
    `${CURRENCY_SYMBOL} ${price.toFixed(2)}`;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[
          styles.currentPrice,
          {
            // Red is an urgency signal, not a discount one.
            color: urgent ? colors.destructive : colors.foreground,
            fontSize: fontSize.current,
          },
        ]}
      >
        {formatPrice(currentPrice)}
      </Text>

      {/* The line is drawn as a View rather than with textDecorationLine:
          Android drops the decoration once a custom fontFamily is applied, and
          the global font patch applies one to every Text. */}
      {isDiscounted && (
        <View style={styles.originalPriceWrap}>
          <Text
            style={[
              styles.originalPrice,
              {
                color: colors.mutedForeground,
                fontSize: fontSize.original,
              },
            ]}
          >
            {formatPrice(originalPrice)}
          </Text>
          <View
            style={[
              styles.strikeThrough,
              { backgroundColor: colors.mutedForeground },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    // Cards are half the screen wide, so a discounted price and its struck
    // original don't always fit on one line — let the original drop below
    // instead of being clipped at the card edge.
    flexWrap: 'wrap',
  },
  currentPrice: {
    fontWeight: '700',
  },
  originalPriceWrap: {
    justifyContent: 'center',
  },
  originalPrice: {
    fontWeight: '400',
  },
  strikeThrough: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.9,
  },
});