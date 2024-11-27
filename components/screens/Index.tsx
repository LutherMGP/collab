// @/app/screens/Index.tsx

import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Animated,
  Text,
  ActivityIndicator,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { database } from "@/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/components/indexcomponents/dashboard/Dashboard";
import WelcomeMessage from "@/components/indexcomponents/welcome/WelcomeMessage";
import InfoPanelProjects from "@/components/indexcomponents/infopanels/InfoPanelProjects";
import InfoPanelPublished from "@/components/indexcomponents/infopanels/InfoPanelPublished";
import InfoPanelProducts from "@/components/indexcomponents/infopanels/InfoPanelProducts";

import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  getDoc,
  doc,
  collectionGroup,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const IndexScreen = () => {
  const theme = useColorScheme() || "light";
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    isInfoPanelProjectsVisible,
    isInfoPanelPublishedVisible,
    isInfoPanelProductsVisible,
    isInfoPanelPurchasedVisible,
    isInfoPanelCartVisible,
    isInfoPanelDevelopmentVisible,
  } = useVisibility();

  const shouldShowWelcomeMessage = !(
    isInfoPanelProjectsVisible ||
    isInfoPanelPublishedVisible ||
    isInfoPanelProductsVisible ||
    isInfoPanelPurchasedVisible ||
    isInfoPanelCartVisible ||
    isInfoPanelDevelopmentVisible
  );

  useEffect(() => {
    if (user) {
      const updateLastUsed = async () => {
        const userDocRef = doc(database, "users", user);
        await updateDoc(userDocRef, {
          lastUsed: serverTimestamp(),
        });
      };

      updateLastUsed().catch((error) => {
        console.error("Fejl ved opdatering af sidste brugt timestamp:", error);
      });

      setIsLoading(false);
    }
  }, [user]);

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={16}
    >
      {/* Dashboard komponenten */}
      <View style={styles.dashboardContainer}>
        <Dashboard />
      </View>

      {/* Separator linje */}
      <View
        style={[styles.separator, { backgroundColor: Colors[theme].icon }]}
      />

      {/* Velkomstmeddelelse */}
      {shouldShowWelcomeMessage && <WelcomeMessage />}

      {/* Loading indikator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[theme].text} />
        </View>
      )}

      {/* Fejlbesked */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* InfoPanels */}
      {isInfoPanelProjectsVisible && <InfoPanelProjects />}
      {isInfoPanelPublishedVisible && <InfoPanelPublished />}
      {isInfoPanelProductsVisible && <InfoPanelProducts />}
    </Animated.ScrollView>
  );
};

export default IndexScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    padding: 0,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  dashboardContainer: {},
  separator: {
    height: 0.5,
    width: "100%",
    alignSelf: "center",
    marginBottom: "1.5%",
    marginTop: "3%",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorContainer: {
    padding: 10,
    backgroundColor: "red",
    borderRadius: 5,
    margin: 10,
  },
  errorText: {
    color: "white",
    textAlign: "center",
  },
});
