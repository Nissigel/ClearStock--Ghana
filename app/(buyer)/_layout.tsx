import { Stack } from 'expo-router';

// The buyer area is a Stack: the tab bar lives in the (tabs) group, and the
// shared detail screens in (screens) are pushed ABOVE it. Presenting details
// above the tabs (rather than inside a hidden tab) means they always pop
// cleanly on back and can't be stranded by a tab switch.
export default function BuyerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(screens)" />
    </Stack>
  );
}
