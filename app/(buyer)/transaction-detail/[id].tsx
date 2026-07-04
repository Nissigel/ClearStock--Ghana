import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/ui/OtpInput';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactionById, verifyTransactionOtp } from '@/api/transaction.api';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';
import { Ionicons } from '@expo/vector-icons';

export default function BuyerTransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransactionById(id),
  });

  const { mutate: verifyOtp, isPending } = useMutation({
    mutationFn: (otpCode: string) => verifyTransactionOtp(id, { otp: otpCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-transactions'] });
      Alert.alert('Success', 'Transaction completed successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: () => {
      setOtpError('Invalid OTP. Please try again.');
      setOtp('');
    },
  });

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
        <ScreenHeader showBack title="Transaction" />
      </SafeAreaView>
    );
  }

  const showOtp =
    transaction.status === 'READY_FOR_COLLECTION' ||
    transaction.status === 'DELIVERED';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader showBack title="Transaction Details" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: Radius.lg, ...Shadow.sm }]}>
          <Text style={[styles.listingName, { color: colors.foreground }]}>
            {transaction.listingName}
          </Text>
          <View style={styles.statusRow}>
            <Badge variant={getStatusVariant(transaction.status) as any} label={transaction.status.replace(/_/g, ' ')} />
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {new Date(transaction.createdAt).toLocaleDateString('en-GH')}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: Radius.lg, ...Shadow.sm }]}>
          {[
            { label: 'Seller', value: transaction.seller.fullName },
            { label: 'Quantity', value: `${transaction.quantity} units` },
            { label: 'Price Per Unit', value: `${CURRENCY_SYMBOL}${transaction.priceAtCreation.toFixed(2)}` },
            { label: 'Total Amount', value: `${CURRENCY_SYMBOL}${(transaction.priceAtCreation * transaction.quantity).toFixed(2)}` },
          ].map((item, index, arr) => (
            <View key={item.label} style={[styles.detailRow, { borderBottomColor: colors.border, borderBottomWidth: index < arr.length - 1 ? 0.5 : 0 }]}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {transaction.seller.phoneNumber && (
          <View style={[styles.phoneCard, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: Radius.lg }]}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <View>
              <Text style={[styles.phoneLabel, { color: colors.mutedForeground }]}>Seller Contact</Text>
              <Text style={[styles.phoneNumber, { color: colors.primary }]}>{transaction.seller.phoneNumber}</Text>
            </View>
          </View>
        )}
        {(transaction.status === 'READY_FOR_COLLECTION' ||
          transaction.status === 'DELIVERED') && (
          <Button
            label={`Pay Now — ${CURRENCY_SYMBOL}${(transaction.priceAtCreation * transaction.quantity).toFixed(2)}`}
            onPress={() =>
              router.push({
                pathname: '/(buyer)/payment',
                params: {
                  transactionId: transaction.id,
                  amount: (
                    transaction.priceAtCreation * transaction.quantity
                  ).toString(),
                  sellerName: transaction.seller.fullName,
                },
              })
            }
            style={styles.payButton}
          />
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
        {transaction.status === 'COMPLETED' && (
          <Button
            label="Rate this Seller"
            onPress={() =>
              router.push({
                pathname: '/(buyer)/rate-transaction',
                params: {
                  transactionId: transaction.id,
                  sellerId: transaction.sellerUserId,
                  sellerName: transaction.seller.fullName,
                },
              })
            }
            variant="outline"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
  otpCard: { padding: Spacing.base, borderWidth: 0.5 },
  otpTitle: { fontSize: FontSize.lg, fontWeight: 'bold', marginBottom: Spacing.sm },
  otpDesc: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.lg },
  otpInput: { marginBottom: Spacing.lg },
});