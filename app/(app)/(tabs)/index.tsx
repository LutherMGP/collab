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
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const Index = () => {
  const theme = useColorScheme() || "light";
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for panel synlighed
  const [projectPanelStatus, setProjectPanelStatus] = useState<"Project" | "Published" | null>(null);
  const [showCatalogPanel, setShowCatalogPanel] = useState(false);

  // Velkomsthilsen vises, hvis ingen paneler er åbne
  const shouldShowWelcomeMessage = !projectPanelStatus && !showCatalogPanel;

  useEffect(() => {
    const updateLastUsed = async () => {
      if (user) {
        try {
          const userDocRef = doc(database, "users", user);
          await updateDoc(userDocRef, { lastUsed: serverTimestamp() });
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

  // Funktioner til panelstyring
  const showProjectPanel = (status: "Project" | "Published" | null) => {
    setProjectPanelStatus(status);
  };

  const hideProjectPanel = () => {
    setProjectPanelStatus(null);
  };

  const showCatalogPanelHandler = () => {
    setShowCatalogPanel(true);
  };

  const hideCatalogPanelHandler = () => {
    setShowCatalogPanel(false);
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
      {/* Dashboard */}
      <View style={styles.dashboardContainer}>
        <Dashboard 
          onShowProjectPanel={showProjectPanel} 
          onShowCatalogPanel={showCatalogPanelHandler} 
        />
      </View>

      {/* Velkomsthilsen */}
      {shouldShowWelcomeMessage && <WelcomeMessage />}

      {/* Fejlbesked */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* InfoPanelProjects */}
      {projectPanelStatus && (
        <View style={styles.infoPanelContainer}>
          <InfoPanelProjects
            statusFilter={projectPanelStatus}
            onClose={hideProjectPanel}
          />
        </View>
      )}

      {/* InfoPanelCatalog */}
      {showCatalogPanel && (
        <View style={styles.infoPanelContainer}>
          <InfoPanelCatalog onClose={hideCatalogPanelHandler} />
        </View>
      )}
    </Animated.ScrollView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  dashboardContainer: {
    marginVertical: 20,
  },
  infoPanelContainer: {
    width: "100%",
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