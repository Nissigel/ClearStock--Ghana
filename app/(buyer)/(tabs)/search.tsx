import { View, StyleSheet, Keyboard } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { SearchBar } from '@/components/ui/SearchBar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
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
    Keyboard.dismiss();
    router.push({
      pathname: '/(buyer)/(tabs)/listing/[id]',
      params: { id: String(listing.id) },
    });
  };

  // Dismiss the keyboard whenever this screen loses focus — switching tabs,
  // pushing a listing, or going back should never leave it hanging open.
  useFocusEffect(
    useCallback(() => {
      return () => {
        Keyboard.dismiss();
      };
    }, [])
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      {router.canGoBack() && <ScreenHeader title="Search" />}
      <View
        style={[
          styles.searchContainer,
          { borderBottomColor: colors.border },
        ]}
      >
        <SearchBar
          value={search}
          onChangeText={setSearch}
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