import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';

export default function GuestLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="listing/[id]" />
      <Stack.Screen name="seller/[id]" />
      <Stack.Screen name="onboarding/1" />
      <Stack.Screen name="onboarding/2" />
    </Stack>
  );
}