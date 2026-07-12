import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Radius, FontSize, Spacing, Shadow } from '@/constants/theme';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Badge } from '@/components/ui/Badge';
import { PriceDropCountdown } from '@/components/ui/PriceDropCountdown';
import type { ListingSummary } from '@/types/listing.types';
import { Heading, Label, Caption } from '@/components/ui/Typography';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.base * 2 - Spacing.sm) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 0.85;

interface ListingCardProps {
  listing: ListingSummary;
  onPress: () => void;
  onSave?: () => void;
  style?: ViewStyle;
}

export function ListingCard({
  listing,
  onPress,
  onSave,
  style,
}: ListingCardProps) {
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);

  const isDiscounted = listing.currentPrice < listing.originalPrice;
  const discountPercent = isDiscounted
    ? Math.round(
        ((listing.originalPrice - listing.currentPrice) /
          listing.originalPrice) *
          100
      )
    : 0;
  const isDeepDiscount = discountPercent >= 30;
const daysUntilExpiry = listing.expiryDate
    ? Math.ceil(
        (new Date(listing.expiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
const isUrgent = daysUntilExpiry !== null && daysUntilExpiry <= 21;

  const getInitials = (): string => {
    const name = listing.productName;
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const rawImageUrl = listing.images[0];
  const primaryImageUrl =
    rawImageUrl && !rawImageUrl.startsWith('file://') && !imageFailed
      ? rawImageUrl
      : null;
  const sellerName = listing.sellerBusinessName;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: Radius.lg,
          borderColor: colors.border,
          ...Shadow.sm,
        },
        style,
      ]}
    >
      {/* Image */}
      <View
        style={[
          styles.imageContainer,
          {
            backgroundColor: colors.secondary,
            borderTopLeftRadius: Radius.lg,
            borderTopRightRadius: Radius.lg,
            height: IMAGE_HEIGHT,
          },
        ]}
      >
       {primaryImageUrl ? (
          <Image
            source={{ uri: primaryImageUrl }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text
              style={[
                styles.placeholderText,
                { color: colors.primary },
              ]}
            >
              {getInitials()}
            </Text>
          </View>
        )}
        {/* Save button */}
        <TouchableOpacity
          onPress={onSave}
          style={styles.saveButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={[
              styles.saveButtonBg,
              { backgroundColor: colors.card },
            ]}
          >
            <Ionicons
              name="heart-outline"
              size={16}
              color={colors.mutedForeground}
            />
          </View>
        </TouchableOpacity>

        {/* Deep discount flame badge */}
       {isDeepDiscount && (
            <View style={styles.flameBadge}>
              <Badge variant="discount" label={`${discountPercent}% OFF`} />
            </View>
          )}
          {isUrgent && !isDeepDiscount && (
            <View style={styles.flameBadge}>
              <Badge variant="expirySoon" label={`${daysUntilExpiry}d left`} />
            </View>
          )}
      </View>
      {/* Details */}
      <View style={styles.details}>
       <Heading
          numberOfLines={2}
          style={styles.productName}
          color={colors.foreground}
        >
          {listing.productName}
        </Heading>

        <PriceDisplay
          currentPrice={listing.currentPrice}
          originalPrice={listing.originalPrice}
          size="sm"
          containerStyle={styles.price}
        />

        {/* Auto price-drop countdown */}
        {listing.discountActive &&
          listing.listingStatus === 'ACTIVE' &&
          !!listing.discountIntervalDays &&
          listing.currentPrice > listing.minimumAcceptablePrice && (
            <PriceDropCountdown
              createdAt={listing.createdAt}
              intervalDays={listing.discountIntervalDays}
              compact
              style={styles.countdown}
            />
          )}

        {/* Seller info */}
        <Caption
          numberOfLines={1}
          style={styles.sellerName}
        >
          {sellerName}
        </Caption>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  placeholderText: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
    opacity: 0.4,
  },
  saveButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  saveButtonBg: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  flameBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
  },
  details: {
    padding: Spacing.sm,
  },
  productName: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  price: {
    marginBottom: Spacing.xs,
  },
  countdown: {
    marginBottom: Spacing.xs,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: FontSize.xs,
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 2,
  },
});