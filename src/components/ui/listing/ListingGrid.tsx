import {
  FlatList,
  View,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { ListingCard } from '@/components/ui/listing/ListingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingGrid } from '@/components/ui/LoadingGrid';
import type { ListingSummary } from '@/types/listing.types';
import { Spacing } from '@/constants/theme';

interface ListingGridProps {
  listings: ListingSummary[];
  isLoading?: boolean;
  isError?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onEndReached?: () => void;
  onListingPress: (listing: ListingSummary) => void;
  onSavePress?: (listing: ListingSummary) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  containerStyle?: ViewStyle;
  headerComponent?: React.ReactElement;
}

export function ListingGrid({
  listings,
  isLoading = false,
  isError = false,
  onRefresh,
  isRefreshing = false,
  onEndReached,
  onListingPress,
  onSavePress,
  emptyTitle = 'No listings found',
  emptySubtitle = 'Try adjusting your search or filters',
  containerStyle,
  headerComponent,
}: ListingGridProps) {
  if (isLoading) {
    return <LoadingGrid />;
  }

  if (isError) {
    return (
      <EmptyState
        icon="wifi-outline"
        title="Something went wrong"
        subtitle="Please check your connection and try again"
        actionLabel="Retry"
        onAction={onRefresh}
      />
    );
  }

  return (
    <FlatList
      data={listings}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[
        styles.content,
        listings.length === 0 && styles.emptyContent,
        containerStyle,
      ]}
      ListHeaderComponent={headerComponent}
      ListEmptyComponent={
        <EmptyState
          icon="cube-outline"
          title={emptyTitle}
          subtitle={emptySubtitle}
        />
      }
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          onPress={() => onListingPress(item)}
          onSave={() => onSavePress?.(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  content: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['4xl'],
  },
  emptyContent: {
    flex: 1,
  },
});