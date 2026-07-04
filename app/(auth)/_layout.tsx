import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="phone" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="create-pin" />
      <Stack.Screen name="confirm-pin" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="login" />
      <Stack.Screen name="forgot-pin" />
      <Stack.Screen name="reset-pin-otp" />
      <Stack.Screen name="reset-pin-new" />
    </Stack>
  );
}