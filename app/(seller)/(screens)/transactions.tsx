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
import { useQuery } from '@tanstack/react-query';
import { getSellerTransactions } from '@/api/transaction.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import type { Transaction } from '@/types/transaction.types';

export default function SellerTransactionsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['seller-transactions'],
    queryFn: getSellerTransactions,
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

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/(seller)/(screens)/transaction-detail/[id]',
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
          variant={getStatusVariant(item.transactionStatus) as any}
          label={(item.transactionStatus ?? '').replace(/_/g, ' ')}
        />
      </View>
      <Text style={[styles.buyerName, { color: colors.mutedForeground }]}>
        Buyer: {item.buyerPhone}
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
    >
      <ScreenHeader
        showBack
        title="Transactions"
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
              icon="swap-horizontal-outline"
              title="No transactions yet"
              subtitle="Transactions will appear here after accepting purchase requests"
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
  card: { padding: Spacing.base, borderWidth: 0.5 },
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
  buyerName: { fontSize: FontSize.sm, marginBottom: Spacing.sm },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantity: { fontSize: FontSize.sm },
});