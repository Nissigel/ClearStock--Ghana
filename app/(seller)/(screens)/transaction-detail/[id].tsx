import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTransactionById,
  updateTransactionStatus,
  uploadTransactionEvidence,
} from '@/api/transaction.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import type { FulfillmentMethod } from '@/types/transaction.types';

export default function SellerTransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransactionById(id),
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({
      status,
      fulfillmentMethod,
    }: {
      status: 'READY_FOR_COLLECTION' | 'DELIVERED' | 'CANCELLED';
      fulfillmentMethod?: FulfillmentMethod;
    }) => updateTransactionStatus(id, { status, fulfillmentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['seller-transactions'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update status. Please try again.');
    },
  });

  const handleMarkReady = () => {
    Alert.alert(
      'Mark as Ready',
      'How will the buyer receive this order?',
      [
        {
          text: 'Pickup',
          onPress: () =>
            updateStatus({
              status: 'READY_FOR_COLLECTION',
              fulfillmentMethod: 'PICKUP',
            }),
        },
        {
          text: 'Delivery',
          onPress: () =>
            updateStatus({
              status: 'READY_FOR_COLLECTION',
              fulfillmentMethod: 'DELIVERY',
            }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleMarkDelivered = () => {
    Alert.alert(
      'Mark as Delivered',
      'Confirm that you have delivered this order to the buyer?',
      [
        {
          text: 'Confirm',
          onPress: () => updateStatus({ status: 'DELIVERED' }),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const { mutate: uploadEvidence, isPending: isUploadingEvidence } = useMutation({
    mutationFn: (imageUrls: string[]) => uploadTransactionEvidence(id, imageUrls),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to upload evidence. Please try again.');
    },
  });

  const handleAddEvidence = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      uploadEvidence([result.assets[0].uri]);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Transaction',
      'Are you sure you want to cancel this transaction?',
      [
        {
          text: 'Yes Cancel',
          style: 'destructive',
          onPress: () => updateStatus({ status: 'CANCELLED' }),
        },
        { text: 'No', style: 'cancel' },
      ]
    );
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING_FULFILLMENT': return 'pending';
      case 'READY_FOR_COLLECTION': return 'active';
      case 'DELIVERED': return 'active';
      case 'COMPLETED': return 'verified';
      case 'CANCELLED': return 'archived';
      default: return 'unverified';
    }
  };

  if (isLoading || !transaction) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScreenHeader
          showBack
          title="Transaction"
          onBackPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const isPendingFulfillment = transaction.transactionStatus === 'PENDING_FULFILLMENT';
  const isReadyOrDelivered =
    transaction.transactionStatus === 'READY_FOR_COLLECTION' ||
    transaction.transactionStatus === 'DELIVERED';
  const isActive =
    transaction.transactionStatus !== 'COMPLETED' &&
    transaction.transactionStatus !== 'CANCELLED';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader
        showBack
        title="Transaction Details"
        onBackPress={() => router.back()}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
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
          <Text style={[styles.listingName, { color: colors.foreground }]}>
            {transaction.listingProductName}
          </Text>
          <View style={styles.statusRow}>
            <Badge
              variant={getStatusVariant(transaction.transactionStatus) as any}
              label={(transaction.transactionStatus ?? '').replace(/_/g, ' ')}
            />
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {new Date(transaction.createdAt).toLocaleDateString('en-GH')}
            </Text>
          </View>
        </View>

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
          {[
            { label: 'Buyer', value: transaction.buyerPhone },
            { label: 'Quantity', value: `${transaction.quantity} units` },
            {
              label: 'Fulfillment',
              value: transaction.fulfillmentMethod || 'Not set',
            },
          ].map((item, index, arr) => (
            <View
              key={item.label}
              style={[
                styles.detailRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: index < arr.length - 1 ? 0.5 : 0,
                },
              ]}
            >
              <Text
                style={[styles.detailLabel, { color: colors.mutedForeground }]}
              >
                {item.label}
              </Text>
              <Text
                style={[styles.detailValue, { color: colors.foreground }]}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {isActive && (
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
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Delivery Evidence
            </Text>
            <View style={styles.evidenceRow}>
              {(transaction.evidence ?? []).map((item) => (
                <Image
                  key={item.id}
                  source={{ uri: item.imageUrl }}
                  style={[styles.evidenceThumb, { borderRadius: Radius.md }]}
                />
              ))}
              <TouchableOpacity
                onPress={handleAddEvidence}
                disabled={isUploadingEvidence}
                style={[
                  styles.evidenceAdd,
                  {
                    borderColor: colors.border,
                    borderRadius: Radius.md,
                  },
                ]}
              >
                <Ionicons
                  name="camera-outline"
                  size={22}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isPendingFulfillment && (
          <View style={styles.actions}>
            <Button
              label="Mark as Ready"
              onPress={handleMarkReady}
              loading={isPending}
            />
            <Button
              label="Cancel Transaction"
              onPress={handleCancel}
              variant="destructive"
              loading={isPending}
              style={styles.cancelButton}
            />
          </View>
        )}

        {isReadyOrDelivered && transaction.transactionStatus !== 'DELIVERED' && (
          <View style={styles.actions}>
            <Button
              label="Mark as Delivered"
              onPress={handleMarkDelivered}
              loading={isPending}
            />
          </View>
        )}

        {isActive && (
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                borderRadius: Radius.lg,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              If the buyer doesn’t confirm collection with the OTP within 3
              days, the order is cancelled and the item goes back on sale.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  card: { padding: Spacing.base, borderWidth: 0.5 },
  listingName: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: { fontSize: FontSize.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  detailLabel: { fontSize: FontSize.sm },
  detailValue: { fontSize: FontSize.sm, fontWeight: '500' },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  evidenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  evidenceThumb: { width: 72, height: 72 },
  evidenceAdd: {
    width: 72,
    height: 72,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: Spacing.sm },
  cancelButton: { marginTop: Spacing.xs },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderWidth: 0.5,
    gap: Spacing.sm,
  },
  infoText: { fontSize: FontSize.sm, flex: 1, lineHeight: 20 },
});