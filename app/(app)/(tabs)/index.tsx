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
import InfoPanelCatalog from "@/components/indexcomponents/infopanels/catalog/InfoPanelCatalog";
import {
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const Index = () => {
  const theme = useColorScheme() || "light";
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lokale tilstandsvariabler for panel synlighed
  const [projectPanelStatus, setProjectPanelStatus] = useState<"Project" | "Published" | null>(null);
  const [catalogPanelStatus, setCatalogPanelStatus] = useState<"Catalog" | "Favorite" | null>(null);

  // Bestem om velkomsthilsen skal vises (hvis ingen InfoPanels er synlige)
  const shouldShowWelcomeMessage = !projectPanelStatus && !catalogPanelStatus;

  useEffect(() => {
    const updateLastUsed = async () => {
      if (user) {
        try {
          const userDocRef = doc(database, "users", user);
          await updateDoc(userDocRef, {
            lastUsed: serverTimestamp(),
          });
        } catch (error) {
          console.error("Fejl ved opdatering af sidste brugt timestamp:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    updateLastUsed();
  }, [user]);

  // Callback funktioner til at styre panel synlighed
  const showProjectPanel = (status: "Project" | "Published" | null) => {
    setProjectPanelStatus(status); // Tillader nu null
  };

  const hideProjectPanel = () => {
    setProjectPanelStatus(null);
  };

  const showCatalogPanel = (status: "Catalog" | "Favorite" | null) => {
    setCatalogPanelStatus(status); // Tillader nu null
  };

  const hideCatalogPanel = () => {
    setCatalogPanelStatus(null);
  };

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
        <Dashboard
          onShowProjectPanel={showProjectPanel}
          onShowCatalogPanel={showCatalogPanel}
        />
      </View>

      {/* Velkomstmeddelelse - kun synlig hvis ingen InfoPanels er synlige */}
      {shouldShowWelcomeMessage && <WelcomeMessage />}

      {/* Vis en fejlbesked, hvis der er en fejl */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Render InfoPanelProjects kun hvis synlig */}
      {projectPanelStatus && (
        <View style={styles.infoPanelContainer}>
          <InfoPanelProjects
            statusFilter={projectPanelStatus}
            onClose={hideProjectPanel}
          />
        </View>
      )}

      {/* Render InfoPanelCatalog kun hvis synlig */}
      {catalogPanelStatus && (
        <View style={styles.infoPanelContainer}>
          {catalogPanelStatus === "Catalog" || catalogPanelStatus === "Favorite" ? (
            <InfoPanelCatalog
              statusFilter={catalogPanelStatus}
              onClose={hideCatalogPanel}
            />
          ) : (
            <Text>Ugyldig status: {catalogPanelStatus}</Text>
          )}
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
  infoPanelContainer: {
    width: "100%",
    marginTop: 0,
    paddingTop: 0,
    alignSelf: "center",
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