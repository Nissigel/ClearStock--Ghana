import { Stack } from 'expo-router';

export default function SellerScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="create-listing" />
      <Stack.Screen name="seller-profile" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="transaction-detail/[id]" />
    </Stack>
  );
}
