import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  type ViewStyle,
  type ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Radius, FontSize } from '@/constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  /**
   * When true and a photo exists, tapping the avatar opens a full-screen
   * preview (WhatsApp-style) so the picture can be seen at full size.
   */
  enlargeable?: boolean;
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

const PREVIEW_SIZE = Math.min(
  Dimensions.get('window').width,
  Dimensions.get('window').height
) * 0.85;

export function Avatar({
  uri,
  name,
  size = 'md',
  style,
  enlargeable = false,
}: AvatarProps) {
  const { colors } = useTheme();
  const [preview, setPreview] = useState(false);
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
    const image = <Image source={{ uri }} style={imageStyle} />;

    if (!enlargeable) return image;

    return (
      <>
        <Pressable
          onPress={() => setPreview(true)}
          accessibilityRole="imagebutton"
          accessibilityLabel="View photo"
        >
          {image}
        </Pressable>
        <Modal
          visible={preview}
          transparent
          animationType="fade"
          onRequestClose={() => setPreview(false)}
          statusBarTranslucent
        >
          <Pressable
            style={styles.previewBackdrop}
            onPress={() => setPreview(false)}
          >
            <Image
              source={{ uri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <Pressable
              style={styles.previewClose}
              onPress={() => setPreview(false)}
              hitSlop={12}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
          </Pressable>
        </Modal>
      </>
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
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: Radius.lg,
  },
  previewClose: {
    position: 'absolute',
    top: 48,
    right: 24,
  },
});
