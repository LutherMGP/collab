// @/components/indexcomponents/dashboard/Provider.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  CollectionReference,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Provider = () => {
  const { user } = useAuth();
  const { isInfoPanelProviderVisible, showPanel, hideAllPanels } = useVisibility();
  const [applicationCount, setApplicationCount] = useState(0); // Antal ansøgninger

  useEffect(() => {
    if (!user) return;

    const fetchApplications = async () => {
      try {
        let totalApplications = 0;

        // Hent alle projekter, som den aktuelle bruger ejer
        const projectsCollection = collection(
          database,
          "users",
          user,
          "projects"
        ) as CollectionReference;

        const projectDocs = await getDocs(projectsCollection);

        // Iterer gennem hvert projekt
        const projectPromises = projectDocs.docs.map(async (projectDoc) => {
          const projectId = projectDoc.id;

          // Hent 'applications'-sub-collection for hvert projekt
          const applicationsCollection = collection(
            database,
            "users",
            user,
            "projects",
            projectId,
            "applications"
          ) as CollectionReference;

          const applicationsSnapshot = await getDocs(applicationsCollection);

          // Tilføj antallet af ansøgninger i dette projekt til den samlede tæller
          totalApplications += applicationsSnapshot.size;
        });

        // Vent på, at alle forespørgsler er færdige
        await Promise.all(projectPromises);

        // Opdater state med det samlede antal ansøgninger
        setApplicationCount(totalApplications);
      } catch (error) {
        console.error("Fejl ved hentning af ansøgninger:", error);
      }
    };

    fetchApplications();
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

      {/* Tæller-knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelProviderVisible && styles.iconPressed,
        ]}
        onPress={handlePress}
      >
        <Text style={styles.countText}>{applicationCount}</Text>
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