import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing, Radius } from '@/constants/theme';

interface BrandHeaderProps {
  title: string;
  /** Small pill beside the title, e.g. "3 new". Hidden when empty. */
  badge?: string | null;
  /** Optional action on the right of the title row. */
  rightElement?: React.ReactNode;
  /** Renders a search field inside the band when provided. */
  search?: {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    /** Turns the field into a button — used where tapping navigates away. */
    onPress?: () => void;
  };
  /** Extra content inside the band, e.g. filter chips. */
  children?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * The green band at the top of the main screens.
 *
 * Home, Search and Messages all share it so they stay uniform — the two
 * listing cards drifting apart already showed what happens when the same thing
 * is styled in two places.
 */
export function BrandHeader({
  title,
  badge,
  rightElement,
  search,
  children,
  style,
}: BrandHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.band, { backgroundColor: colors.brandGreen }, style]}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text style={[styles.title, { color: colors.brandGreenForeground }]}>
            {title}
          </Text>
          {!!badge && (
            <View style={[styles.badge, { backgroundColor: colors.gold }]}>
              <Text style={[styles.badgeText, { color: colors.goldForeground }]}>
                {badge}
              </Text>
            </View>
          )}
        </View>
        {rightElement}
      </View>

      {search && (
        <View
          style={[
            styles.field,
            {
              backgroundColor: colors.brandGreenField,
              borderColor: 'rgba(255,255,255,0.28)',
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.brandGreenMuted}
          />
          {search.onPress ? (
            <TouchableOpacity style={styles.input} onPress={search.onPress}>
              <Text style={[styles.placeholder, { color: colors.brandGreenMuted }]}>
                {search.placeholder ?? 'Search...'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              value={search.value}
              onChangeText={search.onChangeText}
              placeholder={search.placeholder ?? 'Search...'}
              placeholderTextColor={colors.brandGreenMuted}
              style={[styles.input, { color: colors.brandGreenForeground }]}
              returnKeyType="search"
            />
          )}
          {!!search.value && !search.onPress && (
            <TouchableOpacity onPress={() => search.onChangeText('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.brandGreenMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {!!children && <View style={styles.extra}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  title: {
    fontSize: FontSize['2xl'],
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 0.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: 0,
  },
  placeholder: {
    fontSize: FontSize.base,
  },
  extra: {
    marginTop: Spacing.md,
  },
});
