import { Stack } from 'expo-router';

// The seller area is a Stack: the tab bar lives in the (tabs) group, and the
// shared detail screens in (screens) are pushed ABOVE it, so they pop cleanly
// on back and can't be stranded by a tab switch.
export default function SellerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(screens)" />
    </Stack>
  );
}
