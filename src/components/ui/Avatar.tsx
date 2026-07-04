import {
  View,
  Text,
  Image,
  StyleSheet,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Radius, FontSize } from '@/constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 52,
  xl: 72,
};

const FONT_MAP = {
  sm: FontSize.xs,
  md: FontSize.sm,
  lg: FontSize.base,
  xl: FontSize.xl,
};

export function Avatar({ uri, name, size = 'md', style }: AvatarProps) {
  const { colors } = useTheme();
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_MAP[size];

  const getInitials = (): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: Radius.full,
    borderColor: colors.border,
    borderWidth: 1,
    ...style,
  };

  const imageStyle: ImageStyle = {
    width: dimension,
    height: dimension,
    borderRadius: Radius.full,
    borderColor: colors.border,
    borderWidth: 1,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={imageStyle}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        containerStyle,
        { backgroundColor: colors.secondary },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { color: colors.primary, fontSize },
        ]}
      >
        {getInitials()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
});