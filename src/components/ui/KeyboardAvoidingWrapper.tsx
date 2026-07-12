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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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