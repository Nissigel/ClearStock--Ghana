import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';

export default function PaymentFailedScreen() {
  // transactionId/amount/sellerName come from the old manual-entry payment
  // flow; requestId comes from the newer purchase-request payment flow.
  // Both land on this same screen, so every param here is optional.
  const { transactionId, amount, sellerName, requestId } =
    useLocalSearchParams<{
      transactionId?: string;
      amount?: string;
      sellerName?: string;
      requestId?: string;
    }>();
  const { colors } = useTheme();
  const router = useRouter();

  const handleTryAgain = () => {
    if (requestId) {
      router.replace({
        pathname: '/(buyer)/(screens)/purchase-requests/[id]',
        params: { id: requestId },
      });
    } else {
      router.replace({
        pathname: '/(buyer)/(screens)/payment',
        params: { transactionId, amount, sellerName },
      });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.destructive },
          ]}
        >
          <Ionicons name="close" size={48} color="white" />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Payment Failed
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {amount && sellerName
            ? `Your payment of ${CURRENCY_SYMBOL}${parseFloat(amount).toFixed(2)} to ${sellerName} could not be processed.`
            : 'Your payment could not be processed.'}
        </Text>

        <Button
          label="Try Again"
          onPress={handleTryAgain}
          style={styles.button}
        />
        <Button
          label="Cancel"
          onPress={() => router.replace('/(buyer)/(screens)/transactions')}
          variant="ghost"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xl, fontWeight: 'bold' },
  subtitle: {
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: { width: '100%' },
});