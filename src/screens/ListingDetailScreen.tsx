import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Text } from '@/components/ui/Typography';
import { Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Avatar } from '@/components/ui/Avatar';
import { useQuery } from '@tanstack/react-query';
import { getListingById } from '@/api/listing.api';
import {
  getConversationByListingId,
  createConversation,
} from '@/api/messaging.api';
import { useAuthStore } from '@/store/authStore';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';
import { useState } from 'react';
import { PurchaseRequestSheet } from '@/components/ui/PurchaseRequestSheet';
import { SaleEndsCountdown } from '@/components/ui/SaleEndsCountdown';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 0.75;

export function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [contactingLoading, setContactingLoading] = useState(false);
  const [failedUris, setFailedUris] = useState<Record<string, boolean>>({});

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingById(id),
  });

  const handleRestrictedAction = (action: () => void) => {
    if (!isAuthenticated) {
      router.push('/(auth)/phone');
      return;
    }
    action();
  };

 const handleContactSeller = () => {
    handleRestrictedAction(async () => {
      if (!listing || contactingLoading) return;
      try {
        setContactingLoading(true);
        const listingId = String(listing.id);
        const existing = await getConversationByListingId(listingId);
        const conversation = existing ?? (await createConversation(listingId));
        router.push({
          pathname: '/(buyer)/(screens)/conversation/[id]',
          params: { id: conversation.id },
        });
      } catch {
        // Swallow — the seller card / retry via the button covers failure.
      } finally {
        setContactingLoading(false);
      }
    });
  };

  const [showRequestSheet, setShowRequestSheet] = useState(false);

const handlePurchaseRequest = () => {
    handleRestrictedAction(() => {
      setShowRequestSheet(true);
    });
  };

  const handleSave = () => {
    handleRestrictedAction(() => {
      // Save listing — built in Milestone 3
    });
  };

  const handleViewSellerProfile = () => {
    router.push({
      pathname: '/(guest)/seller/[id]',
      params: { id: String(listing?.sellerId ?? '') },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScreenHeader showBack title="Loading..." />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading listing...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !listing) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScreenHeader showBack title="Error" />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.destructive }]}>
            Could not load listing. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isDiscounted = listing.currentPrice < listing.originalPrice;
  const discountPercent = isDiscounted
    ? Math.round(
        ((listing.originalPrice - listing.currentPrice) /
          listing.originalPrice) *
          100
      )
    : 0;

  const sellerName = listing.sellerBusinessName;

  const validImages = listing.images.filter(
    (uri) => uri && !uri.startsWith('file://') && !failedUris[uri]
  );
  const images: (string | null)[] =
    validImages.length > 0 ? validImages : [null];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {/* Header */}
     <ScreenHeader
        showBack
        transparent
        rightElement={
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => {
                if (isAuthenticated) {
                  router.push({
                    pathname: '/(buyer)/(screens)/report',
                    params: {
                      targetId: String(listing?.id ?? ''),
                      reportType: 'LISTING',
                      targetName: listing?.productName ?? '',
                    },
                  });
                }
              }}
            >
              <Ionicons
                name="flag-outline"
                size={22}
                color={colors.foreground}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave}>
              <Ionicons
                name="heart-outline"
                size={24}
                color={colors.foreground}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Carousel */}
        <View style={[styles.imageCarousel, { height: IMAGE_HEIGHT }]}>
          <FlatList
            data={images}
            keyExtractor={(item, index) => item ?? `placeholder-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setActiveImageIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={[styles.imageItem, { width, height: IMAGE_HEIGHT }]}>
                {item ? (
                  <Image
                    source={{ uri: item }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() =>
                      setFailedUris((prev) => ({ ...prev, [item]: true }))
                    }
                  />
                ) : (
                  <View
                    style={[
                      styles.imagePlaceholder,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.placeholderText,
                        { color: colors.primary },
                      ]}
                    >
                      {listing.productName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          />

          {/* Image dots */}
          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === activeImageIndex
                          ? colors.card
                          : colors.mutedForeground,
                      width: index === activeImageIndex ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Discount badge */}
          {isDiscounted && (
            <View style={styles.discountBadge}>
              <Badge
                variant="discount"
                label={`${discountPercent}% OFF`}
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>

          {/* Product Name */}
          <Text
            style={[styles.productName, { color: colors.foreground }]}
          >
            {listing.productName}
          </Text>

          {/* Price */}
          <PriceDisplay
            currentPrice={listing.currentPrice}
            originalPrice={listing.originalPrice}
            size="lg"
            containerStyle={styles.price}
          />

          {/* Sale end countdown — deliberately not the price-drop schedule, so
              buyers don't hold out for the next markdown. */}
          {listing.listingStatus === 'ACTIVE' && !!listing.clearanceEndDate && (
            <SaleEndsCountdown
              endsAt={listing.clearanceEndDate}
              style={styles.countdown}
            />
          )}

          {/* Status badges */}
          <View style={styles.badgeRow}>
            <Badge
              variant={
                listing.listingStatus === 'ACTIVE' ? 'active' :
                listing.listingStatus === 'OUT_OF_STOCK' ? 'outOfStock' :
                listing.listingStatus === 'EXPIRED' ? 'expired' : 'archived'
              }
            />
            {listing.expirySensitive && (
              <Badge variant="expirySoon" style={styles.badgeMargin} />
            )}
          </View>

          {/* Details Grid */}
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: Radius.lg,
                ...Shadow.sm,
              },
            ]}
          >
            <DetailRow
              label="Category"
              value={listing.category}
              colors={colors}
            />
            <DetailRow
              label="Quantity Available"
              value={`${listing.quantity}${listing.unitOfMeasurement ? ` ${listing.unitOfMeasurement}` : ''}`}
              colors={colors}
            />
            <DetailRow
              label="Original Price"
              value={`${CURRENCY_SYMBOL}${listing.originalPrice.toFixed(2)}`}
              colors={colors}
            />
            <DetailRow
              label="Clearance End Date"
              value={new Date(listing.clearanceEndDate).toLocaleDateString('en-GH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              colors={colors}
            />
            {listing.expiryDate && (
              <DetailRow
                label="Expiry Date"
                value={new Date(listing.expiryDate).toLocaleDateString('en-GH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                colors={colors}
                isLast
              />
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              Description
            </Text>
            <Text
              style={[
                styles.description,
                { color: colors.mutedForeground },
              ]}
            >
              {listing.description}
            </Text>
          </View>

          {/* Seller Card */}
          <TouchableOpacity
            onPress={handleViewSellerProfile}
            style={[
              styles.sellerCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: Radius.lg,
                ...Shadow.sm,
              },
            ]}
          >
            <Avatar
              name={sellerName}
              size="lg"
            />
            <View style={styles.sellerInfo}>
              <Text
                style={[styles.sellerName, { color: colors.foreground }]}
              >
                {sellerName}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View
        style={[
          styles.bottomActions,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Button
          label="Contact Seller"
          onPress={handleContactSeller}
          loading={contactingLoading}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          label="Request to Buy"
          onPress={handlePurchaseRequest}
          style={styles.actionButton}
        />
      </View>

      {listing && (
  <PurchaseRequestSheet
    visible={showRequestSheet}
    onClose={() => setShowRequestSheet(false)}
    listingId={listing.id}
    listingName={listing.productName}
    currentPrice={listing.currentPrice}
    availableQuantity={listing.quantity}
    unitOfMeasurement={listing.unitOfMeasurement}
  />
)}
    </SafeAreaView>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  isLast?: boolean;
}

function DetailRow({ label, value, colors, isLast }: DetailRowProps) {
  return (
    <View
      style={[
        styles.detailRow,
        !isLast && {
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FontSize.base,
  },
  scrollContent: {
    paddingBottom: Spacing['4xl'],
  },
  imageCarousel: {
    position: 'relative',
  },
  imageItem: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: FontSize['3xl'],
    fontWeight: 'bold',
    opacity: 0.4,
  },
headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    height: 6,
    borderRadius: Radius.full,
  },
  discountBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
  },
  content: {
    padding: Spacing.base,
  },
  productName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    lineHeight: 30,
  },
  price: {
    marginBottom: Spacing.md,
  },
  countdown: {
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  badgeMargin: {
    marginLeft: Spacing.xs,
  },
  detailsCard: {
    borderWidth: 0.5,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.base,
    lineHeight: 24,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderWidth: 0.5,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  sellerType: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  sellerBadgeRow: {
    flexDirection: 'row',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.sm,
    borderTopWidth: 0.5,
  },
  actionButton: {
    flex: 1,
  },
});
