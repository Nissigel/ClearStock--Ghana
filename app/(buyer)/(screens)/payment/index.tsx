import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { initiatePayment, verifyPayment } from '@/api/payment.api';
import { FontSize, FontFamily, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';
import type { PaymentMethod, MoMoNetwork } from '@/types/payment.types';

const MOMO_NETWORKS: { id: MoMoNetwork; label: string; color: string }[] = [
  { id: 'MTN', label: 'MTN MoMo', color: '#FFCC00' },
  { id: 'VODAFONE', label: 'Vodafone Cash', color: '#E60000' },
  { id: 'AIRTELTIGO', label: 'AirtelTigo Money', color: '#FF0000' },
];

const VERIFY_POLL_INTERVAL_MS = 3000;
const VERIFY_POLL_MAX_ATTEMPTS = 15;

export default function PaymentScreen() {
  const { transactionId, amount, sellerName } = useLocalSearchParams<{
    transactionId: string;
    amount: string;
    sellerName: string;
  }>();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOMO');
  const [momoNetwork, setMomoNetwork] = useState<MoMoNetwork>('MTN');
  const [momoNumber, setMomoNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [error, setError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const goToFailed = () => {
    router.replace({
      pathname: '/(buyer)/(screens)/payment/failed',
      params: { transactionId, amount, sellerName },
    });
  };

  const pollForPaymentResult = async (paymentReference: string) => {
    for (let attempt = 0; attempt < VERIFY_POLL_MAX_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, VERIFY_POLL_INTERVAL_MS));
      try {
        const result = await verifyPayment(paymentReference);
        if (result.paymentStatus === 'PAYMENT_SUCCESSFUL') {
          // Refresh the order and the lists so the detail screen shows "Paid"
          // and drops the Pay button when the buyer returns to it.
          queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
          queryClient.invalidateQueries({ queryKey: ['buyer-transactions'] });
          queryClient.invalidateQueries({ queryKey: ['seller-transactions'] });
          router.replace({
            pathname: '/(buyer)/(screens)/payment/success',
            params: { reference: paymentReference, amount, sellerName },
          });
          return;
        }
        if (
          result.paymentStatus === 'PAYMENT_FAILED' ||
          result.paymentStatus === 'PAYMENT_CANCELLED'
        ) {
          goToFailed();
          return;
        }
        // still pending — keep polling
      } catch (err) {
        console.error('Payment verification failed:', err);
      }
    }
    // exhausted attempts without a definitive result
    goToFailed();
  };

  const processPayment = async () => {
    setIsPaying(true);
    try {
      const initiation = await initiatePayment({ transactionId });
      await WebBrowser.openBrowserAsync(initiation.authorizationUrl);
      setIsVerifying(true);
      await pollForPaymentResult(initiation.paymentReference);
    } catch (err) {
      console.error('Payment initiation failed:', err);
      goToFailed();
    } finally {
      setIsPaying(false);
      setIsVerifying(false);
    }
  };

  const validate = (): boolean => {
    if (paymentMethod === 'MOMO') {
      if (!momoNumber.trim() || momoNumber.length < 9) {
        setError('Enter a valid MoMo number');
        return false;
      }
    } else {
      if (!cardNumber.trim() || cardNumber.length < 16) {
        setError('Enter a valid card number');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handlePay = () => {
    if (!validate()) return;
    Alert.alert(
      'Confirm Payment',
      `Pay ${CURRENCY_SYMBOL} ${parseFloat(amount).toFixed(2)} to ${sellerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => processPayment() },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader showBack title="Make Payment" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <View
          style={[
            styles.amountCard,
            { backgroundColor: colors.primary, borderRadius: Radius.lg },
          ]}
        >
          <Text style={[styles.amountLabel, { color: colors.primaryForeground }]}>
            Total Amount
          </Text>
          <Text style={[styles.amount, { color: colors.gold }]}>
            {CURRENCY_SYMBOL} {parseFloat(amount).toFixed(2)}
          </Text>
          <Text style={[styles.sellerName, { color: colors.primaryForeground }]}>
            To: {sellerName}
          </Text>
        </View>

        {/* Payment Method */}
        <View style={styles.methodRow}>
          {(['MOMO', 'CARD'] as PaymentMethod[]).map((method) => (
            <TouchableOpacity
              key={method}
              onPress={() => setPaymentMethod(method)}
              style={[
                styles.methodButton,
                {
                  backgroundColor:
                    paymentMethod === method ? colors.primary : colors.card,
                  borderColor:
                    paymentMethod === method ? colors.primary : colors.border,
                  borderRadius: Radius.md,
                },
              ]}
            >
              <Ionicons
                name={method === 'MOMO' ? 'phone-portrait-outline' : 'card-outline'}
                size={20}
                color={paymentMethod === method ? colors.primaryForeground : colors.foreground}
              />
              <Text
                style={[
                  styles.methodLabel,
                  {
                    color:
                      paymentMethod === method
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {method === 'MOMO' ? 'Mobile Money' : 'Card'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {paymentMethod === 'MOMO' ? (
          <View style={styles.formSection}>
            {/* Network Selection */}
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Select Network
            </Text>
            <View style={styles.networksRow}>
              {MOMO_NETWORKS.map((network) => (
                <TouchableOpacity
                  key={network.id}
                  onPress={() => setMomoNetwork(network.id)}
                  style={[
                    styles.networkButton,
                    {
                      borderColor:
                        momoNetwork === network.id ? colors.primary : colors.border,
                      backgroundColor:
                        momoNetwork === network.id ? colors.secondary : colors.card,
                      borderRadius: Radius.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.networkLabel,
                      {
                        color:
                          momoNetwork === network.id
                            ? colors.primary
                            : colors.foreground,
                      },
                    ]}
                  >
                    {network.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              MoMo Number
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.card,
                  borderColor: error ? colors.destructive : colors.input,
                  borderRadius: Radius.md,
                },
              ]}
            >
              <Text style={[styles.prefix, { color: colors.foreground }]}>
                🇬🇭 +233
              </Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <TextInput
                value={momoNumber}
                onChangeText={(v) => {
                  setMomoNumber(v);
                  if (error) setError('');
                }}
                placeholder="XX XXX XXXX"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                maxLength={10}
                style={[styles.input, { color: colors.foreground, fontFamily: FontFamily.regular }]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.formSection}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Card Number
            </Text>
            <TextInput
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              maxLength={16}
              style={[
                styles.cardInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.input,
                  borderRadius: Radius.md,
                  fontFamily: FontFamily.regular,
                },
              ]}
            />
            <View style={styles.cardRow}>
              <View style={styles.cardHalf}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Expiry
                </Text>
                <TextInput
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={5}
                  style={[
                    styles.cardInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: colors.input,
                      borderRadius: Radius.md,
                      fontFamily: FontFamily.regular,
                    },
                  ]}
                />
              </View>
              <View style={styles.cardHalf}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  CVV
                </Text>
                <TextInput
                  value={cardCvv}
                  onChangeText={setCardCvv}
                  placeholder="123"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  style={[
                    styles.cardInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: colors.input,
                      borderRadius: Radius.md,
                      fontFamily: FontFamily.regular,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>
            {error}
          </Text>
        ) : null}

        <Button
          label={`Pay ${CURRENCY_SYMBOL} ${parseFloat(amount).toFixed(2)}`}
          onPress={handlePay}
          loading={isPaying || isVerifying}
        />

        {isVerifying && (
          <Text style={[styles.verifyingText, { color: colors.mutedForeground }]}>
            Verifying payment...
          </Text>
        )}

        <View style={styles.secureRow}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.secureText, { color: colors.mutedForeground }]}>
            Secured by Paystack
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: Spacing.base, gap: Spacing.md },
  amountCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  amountLabel: { fontSize: FontSize.sm, marginBottom: Spacing.xs },
  amount: { fontSize: FontSize['3xl'], fontWeight: 'bold', marginBottom: Spacing.xs },
  sellerName: { fontSize: FontSize.sm, opacity: 0.8 },
  methodRow: { flexDirection: 'row', gap: Spacing.md },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  methodLabel: { fontSize: FontSize.sm, fontWeight: '600' },
  formSection: { gap: Spacing.sm },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '500' },
  networksRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  networkButton: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1.5 },
  networkLabel: { fontSize: FontSize.xs, fontWeight: '500' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    minHeight: 52,
  },
  prefix: { fontSize: FontSize.base, fontWeight: '500', marginRight: Spacing.sm },
  divider: { width: 1, height: 24, marginRight: Spacing.sm },
  input: { flex: 1, fontSize: FontSize.base, paddingVertical: Spacing.md },
  cardInput: {
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
  },
  cardRow: { flexDirection: 'row', gap: Spacing.md },
  cardHalf: { flex: 1, gap: Spacing.xs },
  error: { fontSize: FontSize.sm, textAlign: 'center' },
  verifyingText: { fontSize: FontSize.sm, textAlign: 'center' },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  secureText: { fontSize: FontSize.xs },
});