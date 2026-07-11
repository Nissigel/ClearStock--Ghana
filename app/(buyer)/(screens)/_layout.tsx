import { Stack } from 'expo-router';

export default function BuyerScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="become-seller" />
      <Stack.Screen name="change-phone" />
      <Stack.Screen name="change-pin" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="notification-preferences" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="deal-alerts" />
      <Stack.Screen name="report" />
      <Stack.Screen name="rate-transaction" />
      <Stack.Screen name="purchase-requests" />
      <Stack.Screen name="transaction-detail/[id]" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="conversation/[id]" />
    </Stack>
  );
}
