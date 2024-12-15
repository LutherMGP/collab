// @/components/indexcomponents/dashboard/Projects.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useVisibility } from "@/hooks/useVisibilityContext";
import {
  collection,
  CollectionReference,
  DocumentData,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { database } from "@/firebaseConfig";

const Projects = () => {
  const theme = "light";
  const { user } = useAuth();
  const { isInfoPanelProjectsVisible, showPanel, hideAllPanels } =
    useVisibility();
  const [draftCount, setDraftCount] = useState(0);
  const [isRightButtonActive, setIsRightButtonActive] = useState(false); // Til højre knap

  useEffect(() => {
    if (!user) return; // Brug user direkte som uid, da det er en streng

    const projectCollection = collection(
      database,
      "users",
      user, // Brug user som uid
      "projects"
    ) as CollectionReference<DocumentData>;

    const q = query(projectCollection, where("status", "==", "Project"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const projects = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDraftCount(projects.length); // Opdater draftCount
      },
      (error) => {
        console.error("Firestore error:", error); // Log fejl
      }
    );

    return () => unsubscribe(); // Ryd op efter lytteren
  }, [user]);

  const handlePressLeft = () => {
    if (isInfoPanelProjectsVisible) {
      hideAllPanels();
    } else {
      showPanel("projects");
    }
    console.log(
      `Draft count button pressed. InfoPanelProjects visibility set to ${!isInfoPanelProjectsVisible}.`
    );
  };

  const handlePressRight = () => {
    setIsRightButtonActive((prev) => !prev); // Skifter visuel tilstand
    console.log("Højre knap blev trykket.");
  };

  return (
    <View style={[styles.createStoryContainer]}>
      <Image
        source={require("@/assets/images/projects.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Venstre knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isInfoPanelProjectsVisible ? styles.iconPressed : null,
          styles.leftButton,
        ]}
        onPress={handlePressLeft}
      >
        <Text style={styles.draftCountText}>{draftCount || 0}</Text>
        {/* Brug fallback */}
      </TouchableOpacity>

      {/* Højre knap */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          isRightButtonActive ? styles.iconPressed : null, // Viser aktiv tilstand
          styles.rightButton,
        ]}
        onPress={handlePressRight}
      >
        <Text style={styles.draftCountText}>+</Text> {/* Placeholder tekst */}
      </TouchableOpacity>

      <View style={styles.createStoryTextContainer}>
        <Text style={[styles.createStoryText, { color: Colors[theme]?.text || "#000" }]}>
          Projects
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  createStoryContainer: {
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
  iconContainer: {
    position: "absolute",
    top: 108,
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
    backgroundColor: "rgba(0, 128, 0, 0.8)", // Aktiv visuel tilstand
  },
  draftCountText: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  createStoryTextContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: "80%",
    height: 40,
    display: "flex",
    borderColor: Colors.light.background,
  },
  createStoryText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 22,
  },
  leftButton: {
    left: "29%", // Placering til venstre
    transform: [{ translateX: -20 }],
  },
  rightButton: {
    right: "29%", // Placering til højre
    transform: [{ translateX: 20 }],
  },
});

export default Projects;