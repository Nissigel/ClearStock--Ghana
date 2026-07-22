import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius } from '@/constants/theme';

/** Kept in step with the backend's SellerService.COMMISSION_RATE_PERCENT. */
export const COMMISSION_RATE = 7;

interface SellerTermsModalProps {
  visible: boolean;
  /** Called once the seller has ticked the box and confirmed. */
  onAgree: () => void;
  /** Called when the seller backs out instead of agreeing. */
  onCancel: () => void;
}

const TERMS: string[] = [
  'List your stock honestly — accurate names, prices, quantities and expiry or clearance dates.',
  'Honour every sale you confirm, at the price and quantity agreed with the buyer.',
  'Only list goods you are allowed to sell. No prohibited, unsafe or counterfeit items.',
  'Buyer payments are held securely and released to you after the buyer confirms delivery.',
  'ClearStock may suspend or remove listings, or your shop, if these terms are broken.',
];

/**
 * A one-time agreement shown the first time a buyer chooses to become a seller.
 * It puts the 7% commission in front of them plainly and will not let them
 * continue until they have ticked the box.
 */
export function SellerTermsModal({
  visible,
  onAgree,
  onCancel,
}: SellerTermsModalProps) {
  const { colors } = useTheme();
  const [agreed, setAgreed] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.background }]}>
          <View
            style={[styles.iconContainer, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="receipt-outline" size={30} color={colors.gold} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Before you start selling
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Please read and accept ClearStock's seller terms.
          </Text>

          {/* The commission is the thing they most need to understand, so it
              gets its own highlighted box rather than being buried in a list. */}
          <View
            style={[
              styles.commissionBox,
              { backgroundColor: colors.accent, borderColor: colors.gold },
            ]}
          >
            <Ionicons
              name="pricetag-outline"
              size={20}
              color={colors.gold}
              style={styles.commissionIcon}
            />
            <View style={styles.commissionTextWrap}>
              <Text style={[styles.commissionTitle, { color: colors.foreground }]}>
                {COMMISSION_RATE}% commission
              </Text>
              <Text
                style={[styles.commissionText, { color: colors.mutedForeground }]}
              >
                ClearStock keeps a {COMMISSION_RATE}% commission on every completed
                sale. It is deducted from the sale amount before your earnings are
                released to you.
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.termsScroll}
            contentContainerStyle={styles.termsContent}
            showsVerticalScrollIndicator
          >
            {TERMS.map((term, index) => (
              <View key={index} style={styles.termRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                  style={styles.termIcon}
                />
                <Text style={[styles.termText, { color: colors.foreground }]}>
                  {term}
                </Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.agreeRow}
            activeOpacity={0.7}
            onPress={() => setAgreed((value) => !value)}
          >
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={24}
              color={agreed ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.agreeText, { color: colors.foreground }]}>
              I have read and agree to the Seller Terms &amp; Conditions,
              including the {COMMISSION_RATE}% commission.
            </Text>
          </TouchableOpacity>

          <Button
            label="Agree & Continue"
            onPress={onAgree}
            disabled={!agreed}
            style={styles.button}
          />
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
              Not now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    alignItems: 'center',
    maxHeight: '88%',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  commissionBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignSelf: 'stretch',
  },
  commissionIcon: {
    marginTop: 2,
  },
  commissionTextWrap: {
    flex: 1,
  },
  commissionTitle: {
    fontSize: FontSize.base,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  commissionText: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  termsScroll: {
    alignSelf: 'stretch',
    marginBottom: Spacing.md,
  },
  termsContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.xs,
  },
  termRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  termIcon: {
    marginTop: 2,
  },
  termText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  agreeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
  },
  agreeText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  button: {
    marginBottom: Spacing.sm,
    width: '100%',
  },
  cancelButton: {
    padding: Spacing.sm,
  },
  cancelText: {
    fontSize: FontSize.sm,
    textDecorationLine: 'underline',
  },
});
