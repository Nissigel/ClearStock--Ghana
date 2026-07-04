import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Radius, FontSize, FontWeight, Spacing } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: size === 'small' ? Radius.full : Radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: isDisabled ? 0.5 : 1,
      alignSelf: fullWidth ? 'stretch' : 'auto',
      ...getSizeStyle(),
    };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: colors.primary };
      case 'secondary':
        return { ...base, backgroundColor: colors.secondary };
      case 'outline':
        return {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'destructive':
        return { ...base, backgroundColor: colors.destructive };
      default:
        return { ...base, backgroundColor: colors.primary };
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: FontWeight.semiBold,
      ...getTextSizeStyle(),
    };

    switch (variant) {
      case 'primary':
        return { ...base, color: colors.primaryForeground };
      case 'secondary':
        return { ...base, color: colors.primary };
      case 'outline':
        return { ...base, color: colors.primary };
      case 'ghost':
        return { ...base, color: colors.primary };
      case 'destructive':
        return { ...base, color: colors.destructiveForeground };
      default:
        return { ...base, color: colors.primaryForeground };
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.xs,
          minHeight: 32,
        };
      case 'medium':
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm + 2,
          minHeight: 42,
        };
      case 'large':
        return {
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.md,
          minHeight: 52,
        };
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return { fontSize: FontSize.sm };
      case 'medium':
        return { fontSize: FontSize.base };
      case 'large':
        return { fontSize: FontSize.md };
    }
  };

  const getSpinnerColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.primaryForeground;
      case 'secondary':
        return colors.primary;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.primary;
      case 'destructive':
        return colors.destructiveForeground;
      default:
        return colors.primaryForeground;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getSpinnerColor()}
          style={styles.spinner}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  spinner: {
    marginRight: Spacing.xs,
  },
});