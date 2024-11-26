// @/app/(app)/_layout.tsx

import { Stack } from "expo-router";

export default function AppEntry() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="modal_assetmanager"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="modal_admin"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="modal_account"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
