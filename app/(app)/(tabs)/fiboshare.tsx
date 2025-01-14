// @/app/(app)/(tabs)/fiboshare.tsx

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
import InfoPanelFiboShare from "@/components/indexcomponents/infopanels/fiboshare/InfoPanelFiboShare";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const FiboShareScreen = () => {
  const theme = useColorScheme() || "light";
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Opdaterer brugerens 'lastUsed' timestamp
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
          setError("Kunne ikke opdatere sidste brugt tidspunkt.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    updateLastUsed();
  }, [user]);

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
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

      {/* Render InfoPanelFiboShare */}
      <View style={styles.infoPanelFiboShareContainer}>
        <InfoPanelFiboShare />
      </View>
    </Animated.ScrollView>
  );
};

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
  infoPanelFiboShareContainer: {
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

export default FiboShareScreen;
