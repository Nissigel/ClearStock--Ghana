import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  usePurchaseRequestById,
  useCancelPurchaseRequest,
} from '@/hooks/usePurchaseRequests';
import { getTransactions } from '@/api/transaction.api';
import type { TransactionResponse } from '@/types/transaction.types';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

// matchingTransaction.paymentStatus comes from the /transactions endpoint's
// TransactionResponse, a separate string field from the PaymentController's
// PaymentStatus enum, so this helper accepts a plain string.
const isPaymentSuccessful = (paymentStatus: string): boolean =>
  paymentStatus === 'PAYMENT_SUCCESSFUL';

const formatDate = (value: string | null): string => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function PurchaseRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const isValidId = /^\d+$/.test(id ?? '');

  const {
    data: request,
    isLoading,
    isError,
  } = usePurchaseRequestById(id);
  const { mutate: cancelRequest, isPending } = useCancelPurchaseRequest();

  const isAccepted = request?.status === 'ACCEPTED';

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions,
    enabled: isAccepted,
  });

  const matchingTransaction = transactions?.find(
    (t) => t.purchaseRequestId === request?.id
  );

  const handlePayNow = (transaction: TransactionResponse) => {
    router.push({
      pathname: '/(buyer)/(screens)/payment',
      params: { transactionId: String(transaction.id) },
    });
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

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this purchase request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            cancelRequest(id, {
              onSuccess: () => router.back(),
            });
          },
        },
      ]
    );
  };

  if (!isValidId) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScreenHeader
          showBack
          title="Request Details"
          onBackPress={() => router.replace('/(buyer)/(screens)/purchase-requests')}
        />
        <EmptyState
          icon="alert-circle-outline"
          title="Request not found"
          subtitle="This purchase request link is invalid."
        />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScreenHeader
          showBack
          title="Request Details"
          onBackPress={() => router.replace('/(buyer)/(screens)/purchase-requests')}
        />
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load this request"
          subtitle="Please check your connection and try again."
        />
      </SafeAreaView>
    );
  }

  if (isLoading || !request) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScreenHeader
          showBack
          title="Request Details"
          onBackPress={() => router.replace('/(buyer)/(screens)/purchase-requests')}
        />
      </SafeAreaView>
    );
  }

  const isRequestPending = request.status === 'PENDING';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        title="Request Details"
        onBackPress={() => router.replace('/(buyer)/(screens)/purchase-requests')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.lg,
              ...Shadow.sm,
            },
          ]}
        >
          <Text style={[styles.listingName, { color: colors.foreground }]}>
            {request.listingProductName}
          </Text>
          <View style={styles.statusRow}>
            <Badge
              variant={getStatusVariant(request.status) as any}
              label={request.status}
            />
            <Text
              style={[styles.date, { color: colors.mutedForeground }]}
            >
              {formatDate(request.createdAt)}
            </Text>
          </View>
        </View>

        {/* Request Details */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.lg,
              ...Shadow.sm,
            },
          ]}
        >
          <DetailRow
            label="Seller"
            value={request.sellerPhone}
            colors={colors}
          />
          <DetailRow
            label="Quantity Requested"
            value={`${request.requestedQuantity} units`}
            colors={colors}
          />
          <DetailRow
            label="Expires"
            value={formatDate(request.expiresAt)}
            colors={colors}
            isLast
          />
        </View>

        {/* Phone reveal — only when accepted */}
        {isAccepted && request.sellerPhone && (
          <View
            style={[
              styles.phoneCard,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                borderRadius: Radius.lg,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.success}
            />
            <View style={styles.phoneInfo}>
              <Text
                style={[styles.phoneLabel, { color: colors.foreground }]}
              >
                Request Accepted
              </Text>
              <Text
                style={[
                  styles.phoneNumber,
                  { color: colors.primary },
                ]}
              >
                {request.sellerPhone}
              </Text>
            </View>
          </View>
        )}

        {/* Pay Now — only when accepted, a matching transaction exists, and
            payment hasn't already succeeded */}
        {isAccepted &&
          matchingTransaction &&
          !isPaymentSuccessful(matchingTransaction.paymentStatus) && (
            <Button
              label="Pay Now"
              onPress={() => handlePayNow(matchingTransaction)}
              style={styles.payButton}
            />
          )}

        {/* Paid indicator — payment already succeeded */}
        {isAccepted &&
          matchingTransaction &&
          isPaymentSuccessful(matchingTransaction.paymentStatus) && (
            <View
              style={[
                styles.paidCard,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderRadius: Radius.lg,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.success}
              />
              <View style={styles.paidInfo}>
                <Text style={[styles.paidLabel, { color: colors.foreground }]}>
                  Paid
                </Text>
                {matchingTransaction.transactionStatus ===
                  'READY_FOR_COLLECTION' && (
                  <Text
                    style={[
                      styles.paidSubtext,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Ready for collection
                    {matchingTransaction.otpCode
                      ? ` — show code ${matchingTransaction.otpCode} to the seller`
                      : ''}
                  </Text>
                )}
              </View>
            </View>
          )}

        {/* No matching transaction yet — seller hasn't been billed for it */}
        {isAccepted && !matchingTransaction && (
          <Text
            style={[styles.preparingNote, { color: colors.mutedForeground }]}
          >
            Preparing your order...
          </Text>
        )}

        {/* Cancel button — only when pending */}
        {isRequestPending && (
          <Button
            label="Cancel Request"
            onPress={handleCancel}
            variant="destructive"
            loading={isPending}
            style={styles.cancelButton}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  colors: any;
  isLast?: boolean;
  highlight?: boolean;
}

function DetailRow({
  label,
  value,
  colors,
  isLast,
  highlight,
}: DetailRowProps) {
  return (
    <View
      style={[
        styles.detailRow,
        !isLast && {
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.detailValue,
          {
            color: highlight ? colors.primary : colors.foreground,
            fontWeight: highlight ? '700' : '500',
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    padding: Spacing.base,
    gap: Spacing.md,
    paddingBottom: Spacing['4xl'],
  },
  statusCard: {
    padding: Spacing.base,
    borderWidth: 0.5,
  },
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
  date: {
    fontSize: FontSize.xs,
  },
  detailsCard: {
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  detailValue: {
    fontSize: FontSize.sm,
    flex: 1,
    textAlign: 'right',
  },
  phoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderWidth: 0.5,
    gap: Spacing.md,
  },
  phoneInfo: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: Spacing.sm,
  },
  payButton: {
    marginTop: Spacing.sm,
  },
  paidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderWidth: 0.5,
    gap: Spacing.md,
  },
  paidInfo: {
    flex: 1,
  },
  paidLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  paidSubtext: {
    fontSize: FontSize.xs,
  },
  preparingNote: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});