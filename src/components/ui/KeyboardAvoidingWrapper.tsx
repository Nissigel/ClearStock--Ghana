import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  scrollEnabled?: boolean;
}

export function KeyboardAvoidingWrapper({
  children,
  containerStyle,
  scrollEnabled = true,
}: KeyboardAvoidingWrapperProps) {
  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      // On Android the window already resizes for the keyboard
      // (softwareKeyboardLayoutMode: "resize"), so the 'height' behaviour on top
      // of that made the layout jump. Let the resize handle it and only pad on
      // iOS, where there's no automatic resize.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: colors.background },
          containerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});