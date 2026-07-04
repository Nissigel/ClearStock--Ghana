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
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  usePurchaseRequestById,
  useCancelPurchaseRequest,
} from '@/hooks/usePurchaseRequests';
import { FontSize, Spacing, Radius, Shadow } from '@/constants/theme';
import { CURRENCY_SYMBOL } from '@/constants/app';
import { Ionicons } from '@expo/vector-icons';

export default function PurchaseRequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();

  const { data: request, isLoading } = usePurchaseRequestById(id);
  const { mutate: cancelRequest, isPending } = useCancelPurchaseRequest();

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

  if (isLoading || !request) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScreenHeader showBack title="Request Details" />
      </SafeAreaView>
    );
  }

  const totalAmount = request.priceAtRequest * request.requestedQuantity;
  const isAccepted = request.status === 'ACCEPTED';
  const isRequestPending = request.status === 'PENDING';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader showBack title="Request Details" />

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
            {request.listingName}
          </Text>
          <View style={styles.statusRow}>
            <Badge
              variant={getStatusVariant(request.status) as any}
              label={request.status}
            />
            <Text
              style={[styles.date, { color: colors.mutedForeground }]}
            >
              {new Date(request.createdAt).toLocaleDateString('en-GH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
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
            value={request.seller.fullName}
            colors={colors}
          />
          <DetailRow
            label="Quantity Requested"
            value={`${request.requestedQuantity} units`}
            colors={colors}
          />
          <DetailRow
            label="Price Per Unit"
            value={`${CURRENCY_SYMBOL}${request.priceAtRequest.toFixed(2)}`}
            colors={colors}
          />
          <DetailRow
            label="Total Amount"
            value={`${CURRENCY_SYMBOL}${totalAmount.toFixed(2)}`}
            colors={colors}
            highlight
          />
          <DetailRow
            label="Expires"
            value={new Date(request.expiresAt).toLocaleDateString('en-GH', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            colors={colors}
            isLast
          />
        </View>

        {/* Phone reveal — only when accepted */}
        {isAccepted && request.seller.phoneNumber && (
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
                {request.seller.phoneNumber}
              </Text>
            </View>
          </View>
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
});