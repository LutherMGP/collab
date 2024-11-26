// @/app/_layout.tsx

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { AuthProvider } from "@/hooks/useAuth";
import { VisibilityProvider } from "@/hooks/useVisibilityContext";

// Catch any errors thrown by the Layout component.
export { ErrorBoundary } from "expo-router";

// Ensure that reloading on `/modal` keeps a back button present.
export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// RootLayout
export default function RootLayout() {
  // Load the fonts.
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Throw an error if one occurs.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Hide the splash screen when the fonts are loaded.
  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // If the fonts are not loaded, return null.
  if (!loaded) {
    return null;
  }

  // Return the RootLayoutNav component.
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  // Get the color scheme.
  const colorScheme = useColorScheme();

  // Return the RootLayoutNav component.
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <VisibilityProvider>
          <Slot />
        </VisibilityProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
