import { View, StyleSheet } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { SearchBar } from '@/components/ui/SearchBar';
import { ListingGrid } from '@/components/ui/listing/ListingGrid';
import { useListings } from '@/hooks/useListings';
import { Spacing } from '@/constants/theme';
import type { ListingSummary } from '@/types/listing.types';

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch, isRefetching } = useListings({
    search,
    page: 0,
    size: 20,
  });

  const handleListingPress = (listing: ListingSummary) => {
    router.push({
      pathname: '/(guest)/listing/[id]',
      params: { id: listing.id },
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View
        style={[
          styles.searchContainer,
          { borderBottomColor: colors.border },
        ]}
      >
        <SearchBar
          value={search}
          onChangeText={setSearch}
          autoFocus
          placeholder="Search products, sellers..."
          containerStyle={styles.searchBar}
        />
      </View>

      <ListingGrid
        listings={data?.content ?? []}
        isLoading={isLoading}
        isError={isError}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        onListingPress={handleListingPress}
        emptyTitle={search ? 'No results found' : 'Start searching'}
        emptySubtitle={
          search
            ? `No listings match "${search}"`
            : 'Search for products, categories or seller names'
        }
        emptyIcon={search ? 'search-outline' : 'search'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  searchContainer: {
    padding: Spacing.base,
    borderBottomWidth: 0.5,
  },
  searchBar: {
    marginBottom: 0,
  },
});