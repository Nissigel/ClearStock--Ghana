import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius } from '@/constants/theme';

interface AuthPromptSheetProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthPromptSheet({
  visible,
  onClose,
  message = 'Login or register to continue',
}: AuthPromptSheetProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    router.push('/(auth)/login');
  };

  const handleRegister = () => {
    onClose();
    router.push('/(auth)/phone');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          {/* Handle */}
          <View
            style={[
              styles.handle,
              { backgroundColor: colors.border },
            ]}
          />

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <Ionicons
              name="close"
              size={24}
              color={colors.foreground}
            />
          </TouchableOpacity>

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.accent },
            ]}
          >
            <Ionicons
              name="lock-closed-outline"
              size={32}
              color={colors.gold}
            />
          </View>

          {/* Text */}
          <Text
            style={[styles.title, { color: colors.foreground }]}
          >
            Sign in to continue
          </Text>
          <Text
            style={[styles.message, { color: colors.mutedForeground }]}
          >
            {message}
          </Text>

          {/* Buttons */}
          <Button
            label="Login"
            onPress={handleLogin}
            style={styles.button}
          />
          <Button
            label="Create an Account"
            onPress={handleRegister}
            variant="outline"
            style={styles.button}
          />

          <TouchableOpacity onPress={onClose} style={styles.skipButton}>
            <Text
              style={[
                styles.skipText,
                { color: colors.mutedForeground },
              ]}
            >
              Continue browsing as guest
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSize.base,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  button: {
    marginBottom: Spacing.sm,
    width: '100%',
  },
  skipButton: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: FontSize.sm,
    textDecorationLine: 'underline',
  },
});