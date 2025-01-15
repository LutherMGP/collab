// @/components/indexcomponents/dashboard/Provider.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { database } from "@/firebaseConfig";
import { updateProjectCounts, getProjectCounts } from "services/projectCountsService";

const Provider = () => {
  const { user } = useAuth();
  const { isInfoPanelProviderVisible, showPanel, hideAllPanels } = useVisibility();
  const [applicationCount, setApplicationCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Start med at læse antallet fra JSON
    (async () => {
      const initialCount = await getProjectCounts("Provider");
      setApplicationCount(initialCount);
      console.log("Initialt antal (fra JSON):", initialCount);
    })();

    // 2. Lyt til Firestore og opdater JSON, hvis nødvendigt
    const projectsRef = collection(database, "users", user, "projects");
    const projectsQuery = query(projectsRef, where("status", "==", "Application"));

    const unsubscribe = onSnapshot(
      projectsQuery,
      async (snapshot) => {
        const firestoreCount = snapshot.size;

        // Læs det tidligere antal fra JSON
        const previousCount = await getProjectCounts("Provider");

        // Hvis antallet i Firestore er anderledes, opdater JSON og state
        if (firestoreCount !== previousCount) {
          await updateProjectCounts("Provider", firestoreCount);
          console.log("Provider opdateret i JSON:", firestoreCount);
        }

        // 3. Læs igen fra JSON for at sikre synkronisering
        const updatedCount = await getProjectCounts("Provider");
        setApplicationCount(updatedCount);
      },
      (error) => {
        console.error("Fejl ved overvågning af Firestore:", error);
      }
    );

    return () => unsubscribe(); // Ryd op ved unmount
  }, [user]);

  const handlePress = () => {
    if (isInfoPanelProviderVisible) {
      hideAllPanels();
    } else {
      showPanel("provider");
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/provider.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelProviderVisible && styles.iconPressed,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.countText}>{applicationCount ?? 0}</Text>
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.text}>Provider</Text>
      </View>
    </View>
  );
};

export default Provider;

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    position: "relative",
    paddingBottom: 10,
    height: 180,
    width: 120,
    alignSelf: "flex-start",
    overflow: "hidden",
    marginLeft: 5,
  },
  profileImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  iconContainer: {
    position: "absolute",
    top: 108,
    left: "50%",
    transform: [{ translateX: -20 }],
    borderRadius: 50,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.7)",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconPressed: {
    backgroundColor: "rgba(0, 128, 0, 0.8)",
  },
  countText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  textContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: 40,
    display: "flex",
    borderColor: Colors.light.background,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 22,
  },
});