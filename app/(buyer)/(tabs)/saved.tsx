import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ListingGrid } from '@/components/ui/listing/ListingGrid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSavedListings, unsaveListing } from '@/api/listing.api';
import type { ListingSummary } from '@/types/listing.types';

const SAVED_LISTINGS_KEY = 'savedListings';

export default function SavedListingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: [SAVED_LISTINGS_KEY],
    queryFn: getSavedListings,
  });

  const { mutate: removeSaved } = useMutation({
    mutationFn: (listingId: string) => unsaveListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SAVED_LISTINGS_KEY] });
    },
  });

  const handleListingPress = (listing: ListingSummary) => {
    router.push({
      pathname: '/(buyer)/(tabs)/listing/[id]',
      params: { id: String(listing.id) },
    });
  };

  const listings = data ?? [];
  const savedIds = new Set(listings.map((l) => String(l.id)));

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader showBack title="Saved Listings" />

      <ListingGrid
        listings={listings}
        isLoading={isLoading}
        isError={isError}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        onListingPress={handleListingPress}
        onSavePress={(listing) => removeSaved(String(listing.id))}
        savedIds={savedIds}
        emptyTitle="No saved listings"
        emptySubtitle="Listings you save will appear here"
        emptyIcon="heart-outline"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});