import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { getBuyerTransactions } from '@/api/transaction.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import type { Transaction } from '@/types/transaction.types';

type OrderFilter = 'ALL' | 'ACTIVE' | 'COMPLETED';

const FILTERS: { key: OrderFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
];

const ACTIVE_STATUSES = [
  'PENDING_FULFILLMENT',
  'READY_FOR_COLLECTION',
  'DELIVERED',
];

export default function BuyerOrdersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<OrderFilter>('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['buyer-transactions'],
    queryFn: getBuyerTransactions,
  });

  const getStatusVariant = (transactionStatus: string) => {
    switch (transactionStatus) {
      case 'PENDING_FULFILLMENT': return 'pending';
      case 'READY_FOR_COLLECTION': return 'active';
      case 'DELIVERED': return 'active';
      case 'COMPLETED': return 'verified';
      case 'CANCELLED': return 'archived';
      default: return 'unverified';
    }
  };

  const orders = (data ?? []).filter((t) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return ACTIVE_STATUSES.includes(t.transactionStatus);
    return t.transactionStatus === 'COMPLETED';
  });

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      onPress={() => router.push({
        pathname: '/(buyer)/(screens)/transaction-detail/[id]',
        params: { id: String(item.id) },
      })}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: Radius.lg,
          ...Shadow.sm,
        },
      ]}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text
          style={[styles.productName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {item.listingProductName}
        </Text>
        <Badge
          variant={getStatusVariant(item.transactionStatus) as any}
          label={(item.transactionStatus ?? '').replace(/_/g, ' ')}
        />
      </View>
      <Text style={[styles.sellerName, { color: colors.mutedForeground }]}>
        From: {item.sellerPhone}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.quantity, { color: colors.mutedForeground }]}>
          Qty: {item.quantity}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          My Orders
        </Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.secondary,
                  borderRadius: Radius.full,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterLabel,
                  {
                    color: isActive
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isRefetching}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="receipt-outline"
              title="No orders yet"
              subtitle="Your orders will appear here once you buy something"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs + 2,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
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
  },
  quantity: { fontSize: FontSize.sm },
});
