import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useBuyerPurchaseRequests } from '@/hooks/usePurchaseRequests';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import type { PurchaseRequest } from '@/types/transaction.types';

export default function PurchaseRequestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useBuyerPurchaseRequests();

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
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/(buyer)/(screens)/purchase-requests/[id]',
          params: { id: String(item.id) },
        })
      }
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
        <Badge
          variant={getStatusVariant(item.status) as any}
          label={item.status}
        />
      </View>

      <Text style={[styles.sellerName, { color: colors.mutedForeground }]}>
        Seller: {item.sellerPhone}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={[styles.quantity, { color: colors.mutedForeground }]}>
          Qty: {item.requestedQuantity}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        title="Purchase Requests"
        onBackPress={() => router.back()}
      />
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
              title="No purchase requests"
              subtitle="Your purchase requests will appear here"
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
  sellerName: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: FontSize.sm,
  },
  price: {
    fontSize: FontSize.base,
    fontWeight: '700',
  },
});