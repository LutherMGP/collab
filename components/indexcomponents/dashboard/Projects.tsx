// @/components/indexcomponents/dashboard/Projects.tsx

import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
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
import { Colors } from "@/constants/Colors";

const Projects: React.FC = () => {
  const { showPanel, activeButton } = useVisibility();
  const { user } = useAuth();
  const [draftCount, setDraftCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    console.log("Henter projekter for bruger:", user);

    const projectCollection = collection(
      database,
      "users",
      user,
      "projects"
    ) as CollectionReference<DocumentData>;

    // Lyt efter "Project" status
    const draftQuery = query(projectCollection, where("status", "==", "Project"));
    const draftUnsubscribe = onSnapshot(draftQuery, (querySnapshot) => {
      console.log("Antal projekter (Project):", querySnapshot.size);
      setDraftCount(querySnapshot.size);
    });

    // Lyt efter "Published" status
    const publishedQuery = query(projectCollection, where("status", "==", "Published"));
    const publishedUnsubscribe = onSnapshot(publishedQuery, (querySnapshot) => {
      console.log("Antal projekter (Published):", querySnapshot.size);
      setPublishedCount(querySnapshot.size);
    });

    return () => {
      draftUnsubscribe();
      publishedUnsubscribe();
    };
  }, [user]);

  return (
    <View style={styles.createStoryContainer}>
      <Image
        source={require("@/assets/images/projects.webp")}
        style={styles.profileImg}
        resizeMode="cover"
      />

      {/* Venstre knap - Projects */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          styles.leftButton,
          activeButton === "projects" ? styles.iconPressed : null,
        ]}
        onPress={() => {
          console.log("Knappen 'Projects' blev trykket.");
          showPanel("projects");
        }}
      >
        <Text style={styles.draftCountText}>{draftCount}</Text>
      </TouchableOpacity>

      {/* Højre knap - Publicated */}
      <TouchableOpacity
        style={[
          styles.iconContainer,
          styles.rightButton,
          activeButton === "publicated" ? styles.iconPressed : null,
        ]}
        onPress={() => {
          console.log("Knappen 'Publicated' blev trykket.");
          showPanel("publicated");
        }}
      >
        <Text style={styles.draftCountText}>{publishedCount}</Text>
      </TouchableOpacity>

      <View style={styles.createStoryTextContainer}>
        <Text style={styles.createStoryText}>Projects</Text>
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
    left: "29%",
    transform: [{ translateX: -20 }],
  },
  rightButton: {
    right: "29%",
    transform: [{ translateX: 20 }],
  },
});

export default Projects;