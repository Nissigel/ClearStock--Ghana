import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/authStore';
import { useModeStore } from '@/store/modeStore';
import { useQuery } from '@tanstack/react-query';
import { getMyListings } from '@/api/listing.api';
import { getSellerTransactions } from '@/api/transaction.api';
import { getRecoveryDashboard, getSellerEarnings } from '@/api/seller.api';
import { getSellerRatingSummary } from '@/api/review.api';
import {
  useReviewPurchaseRequest,
  useSellerPurchaseRequests,
} from '@/hooks/usePurchaseRequests';
import { Badge } from '@/components/ui/Badge';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';
import type { PurchaseRequest } from '@/types/transaction.types';
import type { ListingSummary } from '@/types/listing.types';

const formatGhs = (n: number) =>
  `${CURRENCY_SYMBOL} ${Math.round(n).toLocaleString('en-GH')}`;

// A transaction is "ongoing" while it is neither finished nor cancelled.
const ONGOING_TX_STATUSES = [
  'PENDING_FULFILLMENT',
  'READY_FOR_COLLECTION',
  'DELIVERED',
];

const txStatusVariant = (status: string) => {
  switch (status) {
    case 'PENDING_FULFILLMENT':
      return 'pending';
    case 'READY_FOR_COLLECTION':
    case 'DELIVERED':
      return 'active';
    default:
      return 'unverified';
  }
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  colors: any;
  highlight?: boolean;
  onPress?: () => void;
}

function StatCard({ label, value, icon, colors, highlight, onPress }: StatCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      style={[
        styles.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: Radius.lg,
          ...Shadow.sm,
        },
      ]}
    >
      <View style={styles.statTop}>
        <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[
          styles.statValue,
          { color: highlight ? colors.primary : colors.foreground },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );
}

export default function SellerDashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const switchToBuyer = useModeStore((state) => state.switchToBuyer);

  const { data: listings, refetch: refetchListings } = useQuery({
    queryKey: ['seller-listings'],
    queryFn: getMyListings,
  });

  const {
    data: requests,
    refetch: refetchRequests,
    isRefetching: isRefetchingRequests,
  } = useSellerPurchaseRequests();

  const { data: recovery, refetch: refetchRecovery } = useQuery({
    queryKey: ['recovery-dashboard'],
    queryFn: getRecoveryDashboard,
  });

  const { data: earnings, refetch: refetchEarnings } = useQuery({
    queryKey: ['seller-earnings'],
    queryFn: getSellerEarnings,
  });

  const { data: rating, refetch: refetchRating } = useQuery({
    queryKey: ['seller-rating', user?.id],
    queryFn: () => getSellerRatingSummary(String(user?.id)),
    enabled: !!user?.id,
  });

  const { data: sellerTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['seller-transactions'],
    queryFn: getSellerTransactions,
  });

  // Tab screens stay mounted and React Query doesn't refetch on focus in React
  // Native, so without this a request a buyer submits after the dashboard first
  // loaded would never appear until the app restarts. Refresh on every focus.
  useFocusEffect(
    useCallback(() => {
      refetchRequests();
      refetchListings();
      refetchRecovery();
      refetchEarnings();
      refetchRating();
      refetchTransactions();
    }, [
      refetchRequests,
      refetchListings,
      refetchRecovery,
      refetchEarnings,
      refetchRating,
      refetchTransactions,
    ])
  );

  const { mutate: reviewRequest } = useReviewPurchaseRequest();

  const incomingOrders = (requests ?? [])
    .filter((r) => r.status === 'PENDING')
    .slice(0, 3);

  const ongoingOrders = (sellerTransactions ?? [])
    .filter((t) => ONGOING_TX_STATUSES.includes(t.transactionStatus))
    .slice(0, 3);

  const handleAccept = (request: PurchaseRequest) => {
    Alert.alert(
      'Accept Request',
      `Accept purchase request from ${request.buyerPhone} for ${request.requestedQuantity} units?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () =>
            reviewRequest(
              { id: String(request.id), action: 'ACCEPT' },
              {
                onSuccess: () =>
                  Alert.alert(
                    'Order Accepted',
                    'The order was accepted and is now awaiting the buyer’s payment.'
                  ),
                onError: () =>
                  Alert.alert('Error', 'Could not accept the request. Please try again.'),
              }
            ),
        },
      ]
    );
  };

  const handleDecline = (request: PurchaseRequest) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this request? You can tell the buyer why in the chat.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () =>
            reviewRequest(
              { id: String(request.id), action: 'DECLINE' },
              {
                // Drop the seller into the buyer's thread so they can explain,
                // rather than leaving the buyer with just the auto-message.
                onSuccess: (result) => {
                  const conversationId = (result as PurchaseRequest)
                    ?.conversationId;
                  if (!conversationId) return;
                  router.push({
                    pathname: '/(buyer)/(screens)/conversation/[id]',
                    params: { id: String(conversationId) },
                  });
                },
                onError: () =>
                  Alert.alert('Error', 'Could not decline the request. Please try again.'),
              }
            ),
        },
      ]
    );
  };

  const activeListings =
    listings?.filter((l) => l.listingStatus === 'ACTIVE').length ?? 0;
  const yourListings = (listings ?? []).slice(0, 4);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const listingStatusBadge = (listing: ListingSummary) => {
    if (listing.listingStatus === 'ACTIVE' && listing.quantity <= 5) {
      return <Badge variant="outOfStock" label="Low Stock" />;
    }
    switch (listing.listingStatus) {
      case 'ACTIVE':
        return <Badge variant="active" />;
      case 'OUT_OF_STOCK':
        return <Badge variant="outOfStock" />;
      case 'EXPIRED':
        return <Badge variant="expired" label="Ended" />;
      default:
        return <Badge variant="archived" />;
    }
  };

  const handleSwitchToBuyer = () => {
    switchToBuyer();
    router.replace('/(buyer)/(tabs)/home');
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {greeting} 👋
          </Text>
          <Text
            style={[styles.userName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {user?.fullName ?? 'Your Store'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell />
          <TouchableOpacity
            onPress={handleSwitchToBuyer}
            style={[styles.switchButton, { backgroundColor: colors.secondary }]}
          >
            <Ionicons
              name="swap-horizontal-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.switchText, { color: colors.primary }]}>
              Buyer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingRequests}
            onRefresh={() => {
              refetchRequests();
              refetchListings();
              refetchRecovery();
              refetchRating();
              refetchTransactions();
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Featured stats */}
        <View style={styles.statsGrid}>
          <StatCard
            label="GHS recovered"
            value={formatGhs(recovery?.totalGhsRecovered ?? 0)}
            icon="trending-up-outline"
            colors={colors}
            highlight
            onPress={() => router.push('/(seller)/(screens)/recovery-impact')}
          />
          <StatCard
            label="Your earnings"
            value={formatGhs(earnings?.totalNet ?? 0)}
            icon="wallet-outline"
            colors={colors}
            onPress={() => router.push('/(seller)/(screens)/earnings')}
          />
          <StatCard
            label="Active listings"
            value={String(activeListings)}
            icon="cube-outline"
            colors={colors}
            onPress={() => router.push('/(seller)/(tabs)/listings')}
          />
          <StatCard
            label="Seller rating"
            value={
              rating && rating.totalReviews > 0
                ? `${rating.averageRating.toFixed(1)} ★`
                : 'New'
            }
            icon="star-outline"
            colors={colors}
          />
        </View>

        {/* Incoming Orders */}
        {incomingOrders.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Incoming Orders
              </Text>
              <TouchableOpacity onPress={() => router.push('/(seller)/(tabs)/requests')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.incomingList}>
              {incomingOrders.map((order) => (
                <View
                  key={order.id}
                  style={[
                    styles.orderCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: Radius.lg,
                      ...Shadow.sm,
                    },
                  ]}
                >
                  <View style={styles.orderHeader}>
                    <Text
                      style={[styles.orderProduct, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {order.listingProductName}
                    </Text>
                    <Badge variant="pending" label="New" />
                  </View>
                  <Text
                    style={[styles.orderMeta, { color: colors.mutedForeground }]}
                  >
                    {order.buyerPhone} · Qty {order.requestedQuantity}
                  </Text>
                  <View style={styles.orderActions}>
                    <Button
                      label="Decline"
                      onPress={() => handleDecline(order)}
                      variant="destructive"
                      size="medium"
                      style={styles.orderActionButton}
                    />
                    <Button
                      label="Accept"
                      onPress={() => handleAccept(order)}
                      size="medium"
                      style={styles.orderActionButton}
                    />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Ongoing Orders — live transactions, so the seller sees them here
            without opening the transactions screen first. */}
        {ongoingOrders.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Ongoing Orders
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(seller)/(screens)/transactions')}
              >
                <Text style={[styles.seeAll, { color: colors.primary }]}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.incomingList}>
              {ongoingOrders.map((tx) => (
                <TouchableOpacity
                  key={tx.id}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: '/(seller)/(screens)/transaction-detail/[id]',
                      params: { id: String(tx.id) },
                    })
                  }
                  style={[
                    styles.orderCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: Radius.lg,
                      ...Shadow.sm,
                    },
                  ]}
                >
                  <View style={styles.orderHeader}>
                    <Text
                      style={[styles.orderProduct, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {tx.listingProductName}
                    </Text>
                    <Badge
                      variant={txStatusVariant(tx.transactionStatus) as any}
                      label={tx.transactionStatus.replace(/_/g, ' ')}
                    />
                  </View>
                  <Text
                    style={[styles.orderMeta, { color: colors.mutedForeground }]}
                  >
                    {tx.buyerPhone} · Qty {tx.quantity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Your listings */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Your Listings
          </Text>
          <TouchableOpacity onPress={() => router.push('/(seller)/(tabs)/listings')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              See all
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.listingsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.lg,
              ...Shadow.sm,
            },
          ]}
        >
          {yourListings.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No listings yet. Tap ➕ to create your first one.
            </Text>
          ) : (
            yourListings.map((listing, index) => (
              <TouchableOpacity
                key={listing.id}
                onPress={() => router.push('/(seller)/(tabs)/listings')}
                activeOpacity={0.7}
                style={[
                  styles.listingRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index < yourListings.length - 1 ? 0.5 : 0,
                  },
                ]}
              >
                <View style={styles.listingInfo}>
                  <Text
                    style={[styles.listingName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {listing.productName}
                  </Text>
                  <Text
                    style={[styles.listingMeta, { color: colors.mutedForeground }]}
                  >
                    {listing.quantity} in stock · {formatGhs(listing.currentPrice)}
                  </Text>
                </View>
                {listingStatusBadge(listing)}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  greeting: {
    fontSize: FontSize.sm,
    marginBottom: 2,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  switchText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAll: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    padding: Spacing.base,
    borderWidth: 0.5,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FontSize.xs,
    flex: 1,
  },
  incomingList: {
    gap: Spacing.sm,
  },
  orderCard: {
    padding: Spacing.base,
    borderWidth: 0.5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  orderProduct: {
    fontSize: FontSize.base,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  orderMeta: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.md,
  },
  orderActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  orderActionButton: {
    flex: 1,
  },
  listingsCard: {
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  listingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  listingInfo: {
    flex: 1,
  },
  listingName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  listingMeta: {
    fontSize: FontSize.xs,
  },
  emptyText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});
