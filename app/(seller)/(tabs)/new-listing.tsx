import { Redirect } from 'expo-router';

// The center "+" tab intercepts presses and pushes the create-listing flow
// directly (see app/(seller)/_layout.tsx). This route only exists so the tab
// has a backing screen; if it's ever reached directly, send the user on.
export default function NewListingRedirect() {
  return <Redirect href="/(seller)/(screens)/create-listing" />;
}
