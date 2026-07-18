import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing, Radius } from '@/constants/theme';

/**
 * Ready-made messages a user can send with one tap.
 *
 * Traders on both sides negotiate comfortably in person but not everyone
 * writes English easily, and an empty text box is a real barrier to making a
 * deal. These cover the questions that actually come up, so a conversation can
 * happen without typing a word.
 */
const BUYER_PROMPTS = [
  'Is this still available?',
  'What is the minimum order?',
  'Can we negotiate the price?',
  'Can you deliver?',
  'Where are you located?',
  'Do you accept Mobile Money?',
];

const SELLER_PROMPTS = [
  'Yes, it is still available.',
  'How many do you need?',
  'That price is final.',
  'Yes, I can deliver.',
  'You can collect from my shop.',
  'Yes, I accept Mobile Money.',
];

interface QuickRepliesProps {
  /** Buyers ask; sellers answer. */
  role: 'BUYER' | 'SELLER';
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function QuickReplies({ role, onSelect, disabled }: QuickRepliesProps) {
  const { colors } = useTheme();
  const prompts = role === 'SELLER' ? SELLER_PROMPTS : BUYER_PROMPTS;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {role === 'SELLER' ? 'Quick replies' : 'Quick questions'}
      </Text>
      {/* Scrolls sideways so it never eats the conversation above it. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.row}
      >
        {prompts.map((prompt) => (
          <TouchableOpacity
            key={prompt}
            onPress={() => onSelect(prompt)}
            disabled={disabled}
            activeOpacity={0.8}
            style={[
              styles.chip,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>
              {prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: Spacing.sm,
    gap: 4,
  },
  label: {
    fontSize: FontSize.xs,
    paddingHorizontal: Spacing.base,
  },
  row: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 0.5,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
});
