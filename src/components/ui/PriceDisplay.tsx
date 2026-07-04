import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';

interface PriceDisplayProps {
  currentPrice: number;
  originalPrice: number;
  size?: 'sm' | 'md' | 'lg';
  containerStyle?: ViewStyle;
}

export function PriceDisplay({
  currentPrice,
  originalPrice,
  size = 'md',
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

  const formatPrice = (price: number): string => {
    return `${CURRENCY_SYMBOL}${price.toFixed(2)}`;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text
        style={[
          styles.currentPrice,
          {
            color: isDiscounted ? colors.destructive : colors.foreground,
            fontSize: fontSize.current,
          },
        ]}
      >
        {formatPrice(currentPrice)}
      </Text>

      {isDiscounted && (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  currentPrice: {
    fontWeight: '700',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
});