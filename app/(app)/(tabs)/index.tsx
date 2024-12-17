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
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  getDoc,
  doc,
  collectionGroup,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const Index = () => {
  const theme = useColorScheme() || "light";
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    isInfoPanelProjectsVisible,
    isInfoPanelPublishedVisible,
  } = useVisibility();

  // Bestem om velkomsthilsen skal vises (hvis ingen InfoPanels er synlige)
  const shouldShowWelcomeMessage = !(
    isInfoPanelProjectsVisible ||
    isInfoPanelPublishedVisible
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

      {/* Separator linje efter Snit */}
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
  infoPanelProductsContainer: {
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
