// @/app/(app)/(tabs)/index.tsx

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
import InfoPanelProjects from "@/components/indexcomponents/infopanels/projects/InfoPanelProjects";
import InfoPanelPublished from "@/components/indexcomponents/infopanels/published/InfoPanelPublished";
import InfoPanelCatalog from "components/indexcomponents/infopanels/catalog/InfoPanelCatalog";
import InfoPanelFavorites from "components/indexcomponents/infopanels/favorites/InfoPanelFavorites";
import InfoPanelProvider from "@/components/indexcomponents/infopanels/provider/InfoPanelProvider";
import InfoPanelApplicant from "@/components/indexcomponents/infopanels/applicant/InfoPanelApplicant";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const Index = () => {
  const theme = useColorScheme() || "light";
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    isInfoPanelProjectsVisible,
    isInfoPanelPublishedVisible,
    isInfoPanelCatalogVisible,
    isInfoPanelFavoritesVisible,
    isInfoPanelProviderVisible,
    isInfoPanelApplicantVisible,
  } = useVisibility();

  // Bestem om velkomsthilsen skal vises (hvis ingen InfoPanels er synlige)
  const shouldShowWelcomeMessage = !(
    isInfoPanelProjectsVisible ||
    isInfoPanelPublishedVisible ||
    isInfoPanelCatalogVisible ||
    isInfoPanelFavoritesVisible ||
    isInfoPanelProviderVisible ||
    isInfoPanelApplicantVisible
  );

  // Logger hvilken InfoPanel der er synlig
  useEffect(() => {
    if (isInfoPanelProjectsVisible) {
      console.log("Projects panel er synligt.");
    } else if (isInfoPanelPublishedVisible) {
      console.log("Published panel er synligt.");
    } else if (isInfoPanelCatalogVisible) {
      console.log("Catalog panel er synligt.");
    } else if (isInfoPanelFavoritesVisible) {
      console.log("Favorites panel er synligt.");
    } else if (isInfoPanelProviderVisible) {
      console.log("Provider panel er synligt.");
    } else if (isInfoPanelApplicantVisible) {
      console.log("Applicant panel er synligt.");              
    } else {
      console.log("Ingen paneler er synlige.");
    }
  }, [
    isInfoPanelProjectsVisible,
    isInfoPanelPublishedVisible,
    isInfoPanelCatalogVisible,
    isInfoPanelFavoritesVisible,
    isInfoPanelProviderVisible,
    isInfoPanelApplicantVisible,
  ]);

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

      {/* Separator linje efter Dashboard */}
      <View
        style={[styles.separator, { backgroundColor: Colors[theme].icon }]}
      />

      {/* Velkomstmeddelelse - kun synlig hvis ingen InfoPanels er synlige */}
      {shouldShowWelcomeMessage && <WelcomeMessage />}

      {/* Vis en loading indikator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[theme].text} />
        </View>
      )}

      {/* Vis en fejlbesked, hvis der er en fejl */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Render InfoPanelProjects kun hvis synlig */}
      {isInfoPanelProjectsVisible && (
        <View style={styles.infoPanelProjectsContainer}>
          <InfoPanelProjects />
        </View>
      )}

      {/* Render InfoPanelPublished kun hvis synlig */}
      {isInfoPanelPublishedVisible && (
        <View style={styles.infoPanelPublishedContainer}>
          <InfoPanelPublished />
        </View>
      )}

      {/* Render InfoPanelCatalog kun hvis synlig */}
      {isInfoPanelCatalogVisible && (
        <View style={styles.infoPanelCatalogContainer}>
          <InfoPanelCatalog />
        </View>
      )}

      {/* Render InfoPanelFavorites kun hvis synlig */}
      {isInfoPanelFavoritesVisible && (
        <View style={styles.infoPanelFavoritesContainer}>
          <InfoPanelFavorites />
        </View>
      )}

      {/* Render InfoPanelProvider kun hvis synlig */}
      {isInfoPanelProviderVisible && (
        <View style={styles.infoPanelProviderContainer}>
          <InfoPanelProvider />
        </View>
      )}

      {/* Render InfoPanelApplicant kun hvis synlig */}
      {isInfoPanelApplicantVisible && (
        <View style={styles.infoPanelApplicantContainer}>
          <InfoPanelApplicant />
        </View>
      )}
    </Animated.ScrollView>
  );
};

export default Index;

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
  infoPanelProjectsContainer: {
    width: "100%",
    marginTop: 0,
    paddingTop: 0,
    alignSelf: "center",
  },
  infoPanelPublishedContainer: {
    width: "100%",
    marginTop: 0,
    paddingTop: 0,
    alignSelf: "center",
  },
  infoPanelCatalogContainer: {
    width: "100%",
    marginTop: 0,
    paddingTop: 0,
    alignSelf: "center",
  },
  infoPanelFavoritesContainer: {
    width: "100%",
    marginTop: 0,
    paddingTop: 0,
    alignSelf: "center",
  },
  infoPanelProviderContainer: {
    width: "100%",
    marginTop: 0,
    paddingTop: 0,
    alignSelf: "center",
  },
  infoPanelApplicantContainer: {
    width: "100%",
    marginTop: 0,
    paddingTop: 0,
    alignSelf: "center",
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