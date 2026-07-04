import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';

export default function PaymentSuccessScreen() {
  const { reference, amount, sellerName } = useLocalSearchParams<{
    reference: string;
    amount: string;
    sellerName: string;
  }>();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.success },
          ]}
        >
          <Ionicons name="checkmark" size={48} color="white" />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Payment Successful!
        </Text>
        <Text style={[styles.amount, { color: colors.primary }]}>
          {CURRENCY_SYMBOL}{parseFloat(amount).toFixed(2)}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Payment to {sellerName} was successful
        </Text>

        <View
          style={[
            styles.refCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: Radius.md,
            },
          ]}
        >
          <Text style={[styles.refLabel, { color: colors.mutedForeground }]}>
            Reference
          </Text>
          <Text style={[styles.refValue, { color: colors.foreground }]}>
            {reference}
          </Text>
        </View>

        <Button
          label="View Transaction"
          onPress={() => router.replace('/(buyer)/transactions')}
          style={styles.button}
        />
        <Button
          label="Back to Home"
          onPress={() => router.replace('/(buyer)/home')}
          variant="outline"
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
  amount: { fontSize: FontSize['2xl'], fontWeight: 'bold' },
  subtitle: { fontSize: FontSize.base, textAlign: 'center' },
  refCard: {
    padding: Spacing.md,
    borderWidth: 0.5,
    width: '100%',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  refLabel: { fontSize: FontSize.xs, marginBottom: 2 },
  refValue: { fontSize: FontSize.sm, fontWeight: '600' },
  button: { width: '100%' },
});