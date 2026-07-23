import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactionById, verifyTransactionOtp } from '@/api/transaction.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function BuyerTransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  // Once the OTP is confirmed we show a brief "order complete" screen and then
  // move the buyer on to rating. Holding the rate details here lets the timer
  // fire even as the transaction query refetches underneath.
  const [pendingRate, setPendingRate] = useState<{
    transactionId: string;
    sellerId: string;
    sellerName: string;
  } | null>(null);

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransactionById(id),
    // Always re-read on open: queries are cached for 5 minutes, which is long
    // enough to reopen a finished order and still be shown the OTP box.
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { mutate: verifyOtp, isPending } = useMutation({
    mutationFn: (otpCode: string) => verifyTransactionOtp(id, { otp: otpCode }),
    onSuccess: () => {
      // Refresh this order too, not just the list — otherwise reopening it
      // serves the pre-confirmation copy and shows the OTP box again.
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['buyer-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['seller-transactions'] });
      // Collection confirmed, so the order is complete. Show a short success
      // screen (the effect below moves on to rating a couple of seconds later)
      // rather than dropping the buyer back to reopen the order and hunt for
      // the rate button.
      setPendingRate({
        transactionId: id,
        sellerId: String(transaction?.sellerUserId ?? ''),
        sellerName: transaction?.sellerPhone ?? '',
      });
    },
    onError: () => {
      setOtpError('Invalid OTP. Please try again.');
      setOtp('');
    },
  });

  // Hold "Order complete" for a beat, then open rating. Using replace means
  // backing out of the rating screen lands on the orders list, not back here.
  useEffect(() => {
    if (!pendingRate) return;
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(buyer)/(screens)/rate-transaction',
        params: pendingRate,
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [pendingRate, router]);

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

  if (pendingRate) {
    return (
      <SafeAreaView
        style={[styles.safeArea, styles.successScreen, { backgroundColor: colors.background }]}
      >
        <View style={[styles.successCircle, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark" size={44} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>
          Order complete
        </Text>
        <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
          Taking you to rate the seller…
        </Text>
      </SafeAreaView>
    );
  }

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

  const isCompleted = transaction.transactionStatus === 'COMPLETED';
  const isCancelled = transaction.transactionStatus === 'CANCELLED';

  const showOtp =
    transaction.transactionStatus === 'READY_FOR_COLLECTION' ||
    transaction.transactionStatus === 'DELIVERED';

  // Paying only makes sense on a live order — a cancelled or finished one can
  // never be paid for, so don't offer it.
  const canPay =
    !isCompleted &&
    !isCancelled &&
    transaction.paymentStatus !== 'PAYMENT_SUCCESSFUL';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader
        showBack
        title="Transaction Details"
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(buyer)/(screens)/report',
                params: {
                  targetId: String(transaction.sellerUserId),
                  reportType: 'USER',
                  targetName: transaction.sellerPhone ?? 'this seller',
                },
              })
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="flag-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: Radius.lg, ...Shadow.sm }]}>
          <Text style={[styles.listingName, { color: colors.foreground }]}>
            {transaction.listingProductName}
          </Text>
          <View style={styles.statusRow}>
            <Badge variant={getStatusVariant(transaction.transactionStatus) as any} label={(transaction.transactionStatus ?? '').replace(/_/g, ' ')} />
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {new Date(transaction.createdAt).toLocaleDateString('en-GH')}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: Radius.lg, ...Shadow.sm }]}>
          {[
            { label: 'Seller', value: transaction.sellerPhone },
            { label: 'Quantity', value: `${transaction.quantity} units` },
          ].map((item, index, arr) => (
            <View key={item.label} style={[styles.detailRow, { borderBottomColor: colors.border, borderBottomWidth: index < arr.length - 1 ? 0.5 : 0 }]}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {transaction.sellerPhone && (
          <View style={[styles.phoneCard, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: Radius.lg }]}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.phoneLabel, { color: colors.mutedForeground }]}>Seller Contact</Text>
              <Text style={[styles.phoneNumber, { color: colors.primary }]}>{transaction.sellerPhone}</Text>
            </View>
          </View>
        )}
        {canPay && (
          <Button
            label="Pay Now"
            onPress={() =>
              router.push({
                pathname: '/(buyer)/(screens)/payment',
                params: { transactionId: String(transaction.id) },
              })
            }
            style={styles.payButton}
          />
        )}

        {/* Paid, but the seller hasn't marked it ready yet. Confirms the
            payment went through so the buyer isn't left wondering. */}
        {transaction.paymentStatus === 'PAYMENT_SUCCESSFUL' &&
          !isCompleted &&
          !isCancelled &&
          !showOtp && (
            <View
              style={[
                styles.otpCard,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.primary,
                  borderRadius: Radius.lg,
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              <Text style={[styles.otpTitle, { color: colors.foreground }]}>
                Payment received
              </Text>
              <Text style={[styles.otpDesc, { color: colors.mutedForeground }]}>
                Your payment is in. Waiting for the seller to prepare your order
                for collection — you'll get a code to confirm handover.
              </Text>
            </View>
          )}

        {/* Confirmed — replaces the OTP box once the order is finished. */}
        {isCompleted && (
          <View
            style={[
              styles.otpCard,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.primary,
                borderRadius: Radius.lg,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
            <Text style={[styles.otpTitle, { color: colors.foreground }]}>
              Collection confirmed
            </Text>
            <Text style={[styles.otpDesc, { color: colors.mutedForeground }]}>
              You confirmed receipt of this order, so it's complete. Nothing
              else to do here.
            </Text>
          </View>
        )}

        {isCancelled && (
          <View
            style={[
              styles.otpCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: Radius.lg,
              },
            ]}
          >
            <Ionicons name="close-circle" size={32} color={colors.mutedForeground} />
            <Text style={[styles.otpTitle, { color: colors.foreground }]}>
              Order cancelled
            </Text>
            <Text style={[styles.otpDesc, { color: colors.mutedForeground }]}>
              This order was cancelled, so there's nothing left to pay or
              collect.
            </Text>
          </View>
        )}

        {showOtp && (
          <View style={[styles.otpCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: Radius.lg, ...Shadow.sm }]}>
            <Text style={[styles.otpTitle, { color: colors.foreground }]}>
              Confirm Collection
            </Text>
            <Text style={[styles.otpDesc, { color: colors.mutedForeground }]}>
              Enter the OTP provided by the seller to confirm you have received your order
            </Text>
            <OtpInput
              value={otp}
              onChange={setOtp}
              onComplete={(code) => verifyOtp(code)}
              error={otpError}
              containerStyle={styles.otpInput}
            />
            <Button
              label="Confirm with OTP"
              onPress={() => verifyOtp(otp)}
              loading={isPending}
              disabled={otp.length < 6}
            />
          </View>
        )}
        {/* Offered once per order — once the buyer has rated the seller there's
            nothing left to do, so acknowledge it instead of asking again. */}
        {transaction.transactionStatus === 'COMPLETED' &&
          (transaction.reviewed ? (
            <View style={styles.reviewedRow}>
              <Ionicons name="star" size={16} color={colors.primary} />
              <Text style={[styles.reviewedText, { color: colors.mutedForeground }]}>
                You've reviewed this seller
              </Text>
            </View>
          ) : (
            <Button
              label="Rate this Seller"
              onPress={() =>
                router.push({
                  pathname: '/(buyer)/(screens)/rate-transaction',
                  params: {
                    transactionId: String(transaction.id),
                    sellerId: String(transaction.sellerUserId),
                    sellerName: transaction.sellerPhone,
                  },
                })
              }
              variant="outline"
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  successScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
  },
  successSub: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  content: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['4xl'] },
  card: { padding: Spacing.base, borderWidth: 0.5 },
  listingName: { fontSize: FontSize.lg, fontWeight: 'bold', marginBottom: Spacing.sm },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: FontSize.xs },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md },
  detailLabel: { fontSize: FontSize.sm },
  detailValue: { fontSize: FontSize.sm, fontWeight: '500' },
  phoneCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, borderWidth: 0.5, gap: Spacing.md },
  phoneLabel: { fontSize: FontSize.xs },
  phoneNumber: { fontSize: FontSize.md, fontWeight: 'bold' },
  payButton: { marginBottom: Spacing.md },
  reviewedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  reviewedText: { fontSize: FontSize.sm },
  otpCard: { padding: Spacing.base, borderWidth: 0.5 },
  otpTitle: { fontSize: FontSize.lg, fontWeight: 'bold', marginBottom: Spacing.sm },
  otpDesc: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.lg },
  otpInput: { marginBottom: Spacing.lg },
});