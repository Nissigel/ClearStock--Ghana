import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreatePurchaseRequest } from '@/hooks/usePurchaseRequests';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';

interface PurchaseRequestSheetProps {
  visible: boolean;
  onClose: () => void;
  listingId: number;
  listingName: string;
  currentPrice: number;
  availableQuantity: number;
  unitOfMeasurement: string | null;
}

export function PurchaseRequestSheet({
  visible,
  onClose,
  listingId,
  listingName,
  currentPrice,
  availableQuantity,
  unitOfMeasurement,
}: PurchaseRequestSheetProps) {
  const { colors } = useTheme();
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const { mutate: createRequest, isPending } = useCreatePurchaseRequest();

  const qty = Number(quantity) || 0;
  const totalAmount = qty * currentPrice;

  const handleSubmit = () => {
    if (!quantity.trim() || qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    if (qty > availableQuantity) {
      setError(`Maximum available quantity is ${availableQuantity}`);
      return;
    }
    setError('');
    createRequest(
      { listingId, requestedQuantity: Number(quantity) || 1 },
      {
        onSuccess: () => {
          Alert.alert(
            'Request Sent',
            'Your purchase request has been sent to the seller.',
            [{ text: 'OK', onPress: onClose }]
          );
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to send request. Please try again.';
          Alert.alert('Error', message);
        },
      }
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, { backgroundColor: colors.background }]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Request to Buy
          </Text>
          <Text style={[styles.listingName, { color: colors.mutedForeground }]}>
            {listingName}
          </Text>

          <View
            style={[
              styles.priceInfo,
              { backgroundColor: colors.secondary, borderRadius: Radius.md },
            ]}
          >
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>
              Price per {unitOfMeasurement ?? 'unit'}
            </Text>
            <Text style={[styles.price, { color: colors.primary }]}>
              {CURRENCY_SYMBOL}{currentPrice.toFixed(2)}
            </Text>
          </View>

          <Input
            label={`Quantity (Max: ${availableQuantity} ${unitOfMeasurement ?? 'units'})`}
            placeholder="Enter quantity"
            value={quantity}
            onChangeText={(v) => {
              setQuantity(v);
              if (error) setError('');
            }}
            keyboardType="numeric"
            error={error}
          />

          {qty > 0 && (
            <View
              style={[
                styles.totalRow,
                { borderTopColor: colors.border },
              ]}
            >
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                Total Amount
              </Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                {CURRENCY_SYMBOL}{totalAmount.toFixed(2)}
              </Text>
            </View>
          )}

          <Button
            label="Send Purchase Request"
            onPress={handleSubmit}
            loading={isPending}
            style={styles.button}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  listingName: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  priceLabel: { fontSize: FontSize.sm },
  price: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderTopWidth: 0.5,
  },
  totalLabel: { fontSize: FontSize.base },
  totalAmount: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
  },
  button: { marginTop: Spacing.sm },
});