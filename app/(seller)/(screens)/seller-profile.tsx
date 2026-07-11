import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { FontSize, Spacing } from '@/constants/theme';

export default function SellerProfileEditScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScreenHeader
        showBack
        title="Seller Profile"
        onBackPress={() => router.replace('/(seller)/profile')}
      />
      <View style={styles.container}>
        <Text style={[styles.text, { color: colors.mutedForeground }]}>
          Seller profile edit — coming soon
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
  },
  text: { fontSize: FontSize.base, textAlign: 'center' },
});