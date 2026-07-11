import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  useSellerPurchaseRequests,
  useReviewPurchaseRequest,
} from '@/hooks/usePurchaseRequests';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import type { PurchaseRequest } from '@/types/transaction.types';

export default function SellerRequestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useSellerPurchaseRequests();
  const { mutate: reviewRequest } = useReviewPurchaseRequest();

  const handleAccept = (request: PurchaseRequest) => {
    Alert.alert(
      'Accept Request',
      `Accept purchase request from ${request.buyerPhone} for ${request.requestedQuantity} units?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () =>
            reviewRequest({ id: String(request.id), action: 'ACCEPT' }),
        },
      ]
    );
  };

  const handleDecline = (request: PurchaseRequest) => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () =>
            reviewRequest({ id: String(request.id), action: 'DECLINE' }),
        },
      ]
    );
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'ACCEPTED': return 'active';
      case 'DECLINED': return 'rejected';
      case 'CANCELLED': return 'archived';
      case 'COMPLETED': return 'verified';
      case 'EXPIRED': return 'expired';
      default: return 'unverified';
    }
  };

  const renderItem = ({ item }: { item: PurchaseRequest }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: Radius.lg,
          ...Shadow.sm,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[styles.productName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {item.listingProductName}
        </Text>
        <Badge variant={getStatusVariant(item.status) as any} label={item.status} />
      </View>

      <Text style={[styles.buyerName, { color: colors.mutedForeground }]}>
        From: {item.buyerPhone}
      </Text>

      <View style={styles.detailRow}>
        <Text style={[styles.detail, { color: colors.mutedForeground }]}>
          Qty: {item.requestedQuantity}
        </Text>
      </View>

      {item.status === 'PENDING' && (
        <View style={styles.actions}>
          <Button
            label="Decline"
            onPress={() => handleDecline(item)}
            variant="destructive"
            size="medium"
            style={styles.actionButton}
          />
          <Button
            label="Accept"
            onPress={() => handleAccept(item)}
            size="medium"
            style={styles.actionButton}
          />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader showBack={false} title="Purchase Requests" />
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="document-text-outline"
              title="No requests yet"
              subtitle="Purchase requests from buyers will appear here"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  list: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  card: {
    padding: Spacing.base,
    borderWidth: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  productName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  buyerName: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  detail: {
    fontSize: FontSize.sm,
  },
  price: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});